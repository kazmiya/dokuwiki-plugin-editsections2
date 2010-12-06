<?php
/**
 * EditSections2 Plugin for DokuWiki / syntax.php
 *
 * We use this syntax plugin class only for the renderer functionality.
 * No syntax is provided.
 *
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author  Kazutaka Miyasaka <kazmiya@gmail.com>
 */

// must be run within DokuWiki
if (!defined('DOKU_INC')) {
    die();
}

if (!defined('DOKU_PLUGIN')) {
    define('DOKU_PLUGIN', DOKU_INC . 'lib/plugins/');
}

require_once(DOKU_PLUGIN . 'syntax.php');

class syntax_plugin_editsections2 extends DokuWiki_Syntax_Plugin
{
    /**
     * Returns some info
     */
    function getInfo()
    {
        return confToHash(DOKU_PLUGIN . '/editsections2/plugin.info.txt');
    }

    /**
     * Dummy (only for compatibility reasons)
     */
    function getType()
    {
        return 'baseonly';
    }

    /**
     * Dummy (only for compatibility reasons)
     */
    function getSort()
    {
        return 999;
    }

    /**
     * Dummy (only for compatibility reasons)
     */
    function connectTo($mode)
    {
        // connect to nowhere
    }

    /**
     * Dummy (only for compatibility reasons)
     */
    function handle($match, $state, $pos, &$handler)
    {
        // do nothing
    }

    /**
     * Starts section to put a secedit marker above the first heading
     */
    function render($format, &$renderer, $data)
    {
        // no need to handle DokuWiki Lemming or earlier
        if (
            $format === 'xhtml'
            && function_exists('html_secedit_get_button')
        ) {
            $renderer->startSectionEdit(-1, 'section', 'dummy');
        }
    }
}
