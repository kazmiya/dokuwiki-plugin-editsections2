<?php
/**
 * EditSections2 Plugin for DokuWiki / action.php
 *
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author  Ben Coburn <btcoburn@silicodon.net>
 * @author  Kazutaka Miyasaka <kazmiya@gmail.com>
 */

// must be run within DokuWiki
if (!defined('DOKU_INC')) {
    die();
}

if (!defined('DOKU_PLUGIN')) {
    define('DOKU_PLUGIN', DOKU_INC . 'lib/plugins/');
}

require_once(DOKU_PLUGIN . 'action.php');

class action_plugin_editsections2 extends DokuWiki_Action_Plugin
{
    var $section_levels = null;

    /**
     * Returns some info
     */
    function getInfo()
    {
        return confToHash(DOKU_PLUGIN . '/editsections2/plugin.info.txt');
    }

    /**
     * Registers event handlers
     */
    function register(&$controller)
    {
        if (function_exists('html_secedit_get_button')) {
            $controller->register_hook(
                'DOKUWIKI_STARTED', 'BEFORE',
                $this, 'exportToJSINFO'
            );

            $controller->register_hook(
                'PARSER_HANDLER_DONE', 'BEFORE',
                $this, 'handleInstructions'
            );

            $controller->register_hook(
                'RENDERER_CONTENT_POSTPROCESS', 'BEFORE',
                $this, 'handleHtmlContent'
            );
        } else {
            // for DokuWiki Lemming or earlier
            $controller->register_hook(
                'PARSER_HANDLER_DONE', 'BEFORE',
                $this, 'rewriteEditInstructions'
            );
        }
    }

    /**
     * Exports configuration settings to $JSINFO
     */
    function exportToJSINFO(&$event)
    {
        global $JSINFO;

        $JSINFO['plugin_editsections2'] = array(
            'highlight_target' => $this->getConf('highlight_target'),
        );
    }

    /**
     * Prepends special instruction to put dummy section edit marker
     */
    function handleInstructions(&$event, $param)
    {
        $calls =& $event->data->calls;

        // prepend plugin's instruction to the beginning of instructions
        // (this instruction will be processed by render() in syntax.php)
        array_unshift(
            $calls,
            array('plugin', array('editsections2', array(), 0))
        );

        // keeps section levels for hierarchical mode
        if ($this->getConf('order_type')) {
            $this->setSectionLevels($calls);
        }
    }

    /**
     * Replaces section edit markers
     */
    function handleHtmlContent(&$event, $param)
    {
        if ($event->data[0] !== 'xhtml') {
            return;
        }

        $doc =& $event->data[1];

        $marker_regexp =
            '/<!-- EDIT(\d+) SECTION "([^"]*)" \[(\-?\d+)-(\d*)\] -->/';

        if (preg_match_all($marker_regexp, $doc, $matches)) {
            list($markers, $secids, $titles, $starts, $ends) = $matches;
        } else {
            return;
        }

        $markers_search = array_reverse($markers);

        // build $markers_replace
        if ($this->getConf('order_type')) {
            // mode: hierarchical
            $markers_replace = array();

            // in case instruction is cached
            if ($this->section_levels === null) {
                $this->setSectionLevels();
            }

            // calculate nested section ranges and build new markers
            for ($i = 1, $i_max = count($markers); $i < $i_max; $i++) {
                $markers_replace[] = sprintf(
                    '<!-- EDIT%s SECTION "%s" [%s-%s] -->',
                    $secids[$i],
                    $titles[$i],
                    $starts[$i],
                    $ends[$this->findNestedSectionEnd($i)]
                );
            }

            $markers_replace = array_merge(
                array(''),
                array_reverse($markers_replace)
            );
        } else {
            // mode: flat (shift button positions only)
            $markers_replace = array_merge(
                array(''),
                array_slice($markers_search, 0, -1)
            );
        }

        // shift edit button positions
        $doc = str_replace($markers_search, $markers_replace, $doc);
    }

    /**
     * Keeps section levels
     */
    function setSectionLevels($calls = null)
    {
        global $ID;
        global $conf;

        if ($calls === null) {
            $calls = p_cached_instructions(wikiFN($ID), 'cacheonly');
        }

        list($handler_name, $instructions) = array(0, 1);
        $this->section_levels = array('dummy_entry_for_padding');

        for ($i = 0, $i_max = count($calls); $i < $i_max; $i++) {
            if ($calls[$i][$handler_name] === 'section_open') {
                $section_level = $calls[$i][$instructions][0];

                if ($section_level <= $conf['maxseclevel']) {
                    $this->section_levels[] = $section_level;
                }
            }
        }
    }

    /**
     * Finds the end of nested edit sections
     */
    function findNestedSectionEnd($offset_idx)
    {
        $offset_level = $this->section_levels[$offset_idx];
        $end_idx = $offset_idx;
        $i_max = count($this->section_levels);

        for ($i = $offset_idx + 1; $i < $i_max; $i++) {
            if ($this->section_levels[$i] > $offset_level) {
                $end_idx = $i;
            } else {
                break;
            }
        }

        return $end_idx;
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /**
     * Rewrites instructions (for DokuWiki Lemming or earlier)
     */
    function rewriteEditInstructions(&$event, $param)
    {
        // get the instructions list from the handler
        $calls =& $event->data->calls;

        // index numbers for readability
        list($handler_name, $instructions) = array(0, 1);
        list($pos_start, $pos_end, $sec_level) = array(0, 1, 2);

        // scan instructions for edit
        $sections = array();

        for ($i = 0, $i_max = count($calls); $i < $i_max; $i++) {
            if ($calls[$i][$handler_name] === 'section_edit') {
                $sections[] =& $calls[$i][$instructions];
            }
        }

        $section_count = count($sections);

        // no need to rewrite
        if ($section_count < 2) {
            return;
        }

        // rewrite instructions
        if ($this->getConf('order_type')) {
            // mode: hierarchical
            for ($i = 0, $i_max = $section_count - 1; $i < $i_max; $i++) {
                // shift instructions
                $sections[$i] = $sections[$i + 1];

                // set default pos_end value (end of the wiki page)
                $sections[$i][$pos_end] = 0;

                // find and set the end point of hierarchical section
                $level = $sections[$i][$sec_level];

                for ($j = $i + 2; $j < $section_count; $j++) {
                    if ($level >= $sections[$j][$sec_level]) {
                        $sections[$i][$pos_end] = $sections[$j][$pos_start] - 1;
                        break;
                    }
                }
            }
        } else {
            // mode: flat (shift instructions only)
            for ($i = 0, $i_max = $section_count - 1; $i < $i_max; $i++) {
                $sections[$i] = $sections[$i + 1];
            }
        }

        // hide old last section
        $sections[$section_count - 1][$pos_start] = -1;
    }
}
