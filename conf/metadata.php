<?php
/**
 * Configuration metadata for editsections2 plugin
 * 
 * @author Ben Coburn <btcoburn@silicodon.net>
 * @author Kazutaka Miyasaka <kazmiya@gmail.com>
 */

$meta['order_type'] = array(
    'multichoice',
    '_choices' => array(0, 1)
);

$meta['highlight_target'] = array(
    'multichoice',
    '_choices' => array('default', 'exclude_headings')
);
