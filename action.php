<?php
/**
 * DokuWiki Plugin Edit Sections 2
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Ben Coburn <btcoburn@silicodon.net>
 * @author     Kazutaka Miyasaka <kazmiya@gmail.com>
 */

// must be run within DokuWiki
if (!defined('DOKU_INC')) die();
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');

require_once(DOKU_PLUGIN.'action.php');

class action_plugin_editsections2 extends DokuWiki_Action_Plugin {
    /**
     * Returns some info
     */
    function getInfo() {
        return array(
            'author' => 'Kazutaka Miyasaka',
            'email'  => 'kazmiya@gmail.com',
            'date'   => '2010-01-27',
            'name'   => 'EditSections2 Plugin',
            'desc'   => 'Configures section edit features',
            'url'    => 'http://github.com/kazmiya/dokuwiki-plugin-editsections2'
        );
    }

    /**
     * Registers event handlers
     */
    function register(&$controller) {
        $controller->register_hook('PARSER_HANDLER_DONE', 'BEFORE', $this, 'rewriteEditInstructions');
    }

    /**
     * Rewrites edit instructions
     */
    function rewriteEditInstructions(&$event, $param) {
        // get the instructions list from the handler
        $calls =& $event->data->calls;

        // index number of handlers
        list($handler_name, $instructions) = array(0, 1);

        $sections = array();
        $last = count($calls) - 1;

        // scan instructions for edit
        for ($i = 0; $i <= $last; $i++) {
            switch ($calls[$i][$handler_name]) {
                case 'section_edit':
                    $sections[] =& $calls[$i][$instructions];
                    break;
                case 'table_open':
                    // if table edit feature is implemented...
                    if (isset($calls[$i][$instructions][3])) {
                        $table_opened = true;
                        $table_opening =& $calls[$i][$instructions];
                    }
                    break;
                case 'table_close':
                    if ($table_opened) {
                        // move instructions from table-closing to table-opening
                        $table_opening[2] = $calls[$i][$instructions][0]; // begin
                        $table_opening[3] = $calls[$i][$instructions][1]; // end
                        $calls[$i][$instructions][0] = -1; // hide table closing
                        $table_opened = false;
                    }
                    break;
            }
        }
        $this->rewriteSection($sections);
    }

    /**
     * Rewrites section edit instructions
     */
    function rewriteSection(&$sections) {
        // no need to rewrite
        if (empty($sections) || count($sections) < 2) return;

        // index number of instructions for section edit
        list($pos_start, $pos_end, $sec_level) = array(0, 1, 2);

        $last     = count($sections) - 1;
        $pre_last = $last - 1;

        // rewrite instructions
        if ($this->getConf('order_type')) {
            // mode: hierarchical
            for ($i = 0; $i <= $pre_last; $i++) {
                // shift instructions
                $sections[$i] = $sections[$i + 1];

                // set default pos_end value (end of the wiki page)
                $sections[$i][$pos_end] = 0;

                // find and set the end point of hierarchical section
                for ($j = $i + 2; $j <= $last; $j++) {
                    if ($sections[$i][$sec_level] >= $sections[$j][$sec_level]) {
                        $sections[$i][$pos_end] = $sections[$j][$pos_start] - 1;
                        break;
                    }
                }
            }
        } else {
            // mode: flat (shift instructions only)
            for ($i = 0; $i <= $pre_last; $i++) {
                $sections[$i] = $sections[$i + 1];
            }
        }

        // hide old last section
        $sections[$last][$pos_start] = -1;
    }
}
