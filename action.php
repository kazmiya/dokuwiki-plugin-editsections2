<?php

// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();

if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'action.php');

class action_plugin_editsections extends DokuWiki_Action_Plugin {
	
	function getInfo(){
		return array(
			'author' => 'Ben Coburn',
			'email'  => 'btcoburn@silicodon.net',
			'date'   => '2006-05-23',
			'name'   => 'Edit Section Reorganizer',
			'desc'   => 'Moves edit section buttons up to the heading they originated from. '.
						'Configurable for nested (hierarchical) or flat edit sections. '.
						'Requires the development version of DokuWiki from 2006-05-23 or a later release.',
			'url'    => 'http://source.silicodon.net/releases/dokuwiki-plugins/edit-section-reorganizer/editsections.tgz',
			);
	}
	
	function register(&$controller) {
		$controller->register_hook('PARSER_HANDLER_DONE', 'BEFORE', $this, 'rewrite_sections');
	}
	
	function rewrite_sections(&$event, $ags) {
		// get the instructions list from the handler
		$calls =& $event->data->calls;
		$edits = array();
		$order = $this->getConf('order_type');
		
		// scan instructions for edit sections
		$size = count($calls);
		for ($i=0; $i<$size; $i++) {
			if ($calls[$i][0]=='section_edit') {
				$edits[] =& $calls[$i];
			}
		}
		
		// rewrite edit section instructions
		$last = max(count($edits)-1,0);
		for ($i=0; $i<=$last; $i++) {
			$end = 0;
			// get data to move
			$start = $edits[min($i+1,$last)][1][0];
			$level = $edits[min($i+1,$last)][1][2];
			$name  = $edits[min($i+1,$last)][1][3];
			// find the section end point
			if ($order) {
				$finger = $i+2;
				while (isset($edits[$finger]) && $edits[$finger][1][2]>$level) {
					$finger++;
				}
				if (isset($edits[$finger])) {
					$end = $edits[$finger][1][0]-1;
				}
			} else {
				$end = $edits[min($i+1,$last)][1][1];
			}
			// put the data back where it belongs
			$edits[$i][1][0] = $start;
			$edits[$i][1][1] = $end;
			$edits[$i][1][2] = $level;
			$edits[$i][1][3] = $name;
		}
		$edits[max($last-1,0)][1][1] = 0;  // set new last section
		$edits[$last][1][0] = -1; // hide old last section
	}
	
}
