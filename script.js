/**
 * EditSections2 Plugin for DokuWiki / script.js
 *
 * Replaces section edit highlighting events
 *
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author  Kazutaka Miyasaka <kazmiya@gmail.com>
 */

(function() {
    /**
     * Lookup table for section edit id (startPos => secedit_id)
     */
    var editIdLookup = {};

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    // compatibility check
    if (
        typeof DEPRECATED === 'function' ||
        typeof addInitEvent === 'undefined'
    ) {
        // for DokuWiki Angua or later
        jQuery(replaceSectionEditButtonEvents);
    } else if (typeof JSINFO === 'object') {
        if (JSINFO.plugin_editsections2) {
            // for DokuWiki Anteater and Rincewind
            addInitEvent(replaceSectionEditButtonEvents_Anteater);
        } else {
            // for DokuWiki Lemming
            addInitEvent(replaceSectionEditButtonEvents_Lemming);
        }
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /**
     * Replaces mouseover events on section edit buttons
     */
    function replaceSectionEditButtonEvents() {
        jQuery('form.btn_secedit')
            .each(function() {
                addEditIdLookupTable(this);
            })
            .unbind('mouseover')
            .bind('mouseover', function(event) {
                highlightSections(event);
            })
            // FIXME: a huge change has happened... will make a real fix later
            // https://github.com/splitbrain/dokuwiki/commit/870c8a4b77dd7c2cfdc14045f8604b5bbf34c01e
            .unbind('mouseout')
            .bind('mouseout', function(event) {
                jQuery('.section_highlight').removeClass('section_highlight');
            });
    }

    /**
     * Returns start/end value of the section edit range
     */
    function getRangeValue(range, startOrEnd) {
        var matched,
            ret;

        if (!range || !(matched = /^(\d+)-(\d*)$/.exec(range.value))) {
            ret = false;
        } else if (startOrEnd === 'start') {
            ret = Number(matched[1]);
        } else if (matched[2].length) {
            ret = Number(matched[2]);
        } else {
            ret = 'last';
        }

        return ret;
    }

    /**
     * Scans and adds section edit id lookup table
     */
    function addEditIdLookupTable(sectionEditForm) {
        var parent,
            idMatched,
            startPos;

        parent = sectionEditForm.parentNode;

        if (
            parent &&
            parent.tagName &&
            parent.tagName.toLowerCase() === 'div' &&
            parent.className &&
            (idMatched = /\b(?:editbutton_(\d+))\b/.exec(parent.className)) &&
            (startPos = getRangeValue(sectionEditForm.range, 'start'))
        ) {
            editIdLookup[startPos] = idMatched[1];
        }
    }

    /**
     * Checks if an element is heading
     */
    function isHeading(element) {
        return element.tagName && /^H[1-6]/i.test(element.tagName);
    }

    /**
     * Highlights sections in the edit range
     */
    function highlightSections(event) {
        var sectionEditForm,
            endPos,
            stopClassRegExp,
            doNotHighlightHeadings,
            cursor;

        sectionEditForm = event.target.form;

        if (!sectionEditForm) {
            return;
        }

        endPos = getRangeValue(sectionEditForm.range, 'end');

        // set stopClass regexp
        if (endPos === false) {
            return;
        } else if (endPos === 'last') {
            stopClassRegExp = /\b(?:footnotes)\b/;
        } else if (editIdLookup[endPos + 1]) {
            stopClassRegExp = new RegExp(
                '\\b(?:footnotes|sectionedit' +
                String(editIdLookup[endPos + 1]).replace(/(\W)/g, '\\$1') +
                ')\\b'
            );
        } else {
            // edittable plugin etc.
            return;
        }

        doNotHighlightHeadings =
            JSINFO.plugin_editsections2.highlight_target === 'exclude_headings';

        cursor = sectionEditForm.parentNode;

        // highlight until the stopClass appeared
        while (cursor = cursor.nextSibling) {
            if (!cursor.className) {
                continue;
            }

            if (stopClassRegExp.test(cursor.className)) {
                break;
            }

            if (
                !(doNotHighlightHeadings && isHeading(cursor)) &&
                !/\b(?:editbutton_section)\b/.test(cursor.className)
            ) {
                cursor.className += ' section_highlight';
            }
        }
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /**
     * Replaces mouseover events on section edit buttons
     * (for DokuWiki Anteater and Rincewind)
     */
    function replaceSectionEditButtonEvents_Anteater() {
        var i,
            iMax,
            parent,
            events,
            guid,
            buttonForms,
            sectionEditForms = [];

        buttonForms = getElementsByClass('btn_secedit', document, 'form');

        // extract section edit forms
        for (i = 0, iMax = buttonForms.length; i < iMax; i++) {
            parent = buttonForms[i].parentNode;

            // parent element must be 'div.editbutton_section'
            if (
                parent &&
                parent.tagName &&
                parent.tagName.toLowerCase() === 'div' &&
                parent.className &&
                /\b(?:editbutton_section)\b/.test(parent.className)
            ) {
                sectionEditForms[sectionEditForms.length] = buttonForms[i];
            }
        }

        // remove events and collect section info
        for (i = 0, iMax = sectionEditForms.length; i < iMax; i++) {
            events = sectionEditForms[i].events;

            // remove all of the previously-set mouseover events from the button
            if (events && events.mouseover) {
                for (guid in events.mouseover) {
                    removeEvent(
                        sectionEditForms[i], 'mouseover', events.mouseover[guid]
                    );
                }
            }

            addEditIdLookupTable(sectionEditForms[i]);
        }

        // add new event to highlight sections to be edited
        for (i = 0, iMax = sectionEditForms.length; i < iMax; i++) {
            addEvent(
                sectionEditForms[i],
                'mouseover',
                highlightSections
            );
        }
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /**
     * Replaces mouseover events on section edit buttons
     * (for DokuWiki Lemming)
     */
    function replaceSectionEditButtonEvents_Lemming() {
        var i,
            iMax,
            events,
            guid,
            buttonForms;

        buttonForms = getElementsByClass('btn_secedit', document, 'form');

        for (i = 0, iMax = buttonForms.length; i < iMax; i++) {
            events = buttonForms[i].events;

            // remove all of the previously-set mouseover events from the button
            if (events && events.mouseover) {
                for (guid in events.mouseover) {
                    removeEvent(
                        buttonForms[i], 'mouseover', events.mouseover[guid]
                    );
                }
            }

            // add new mouseover event to highlight sections to be edited
            addEvent(buttonForms[i], 'mouseover', highlightSections_Lemming);
        }
    }

    /**
     * Highlights sections in the edit range
     * (for DokuWiki Lemming or earlier)
     */
    function highlightSections_Lemming(event) {
        var buttonForm,
            sectionEditForm,
            cursor,
            startPos,
            endPos;

        buttonForm = event.target.form;

        // get the end position of the section
        endPos = getRangeValue(buttonForm.lines, 'end');

        if (endPos === false) {
            return;
        }

        cursor = buttonForm.parentNode;

        if (!cursor.tagName || cursor.tagName.toLowerCase() !== 'div') {
            return;
        }

        // add "section_highlight" class to DIV elements in the edit range
        while (cursor = cursor.nextSibling) {
            if (
                !cursor.tagName ||
                cursor.tagName.toLowerCase() !== 'div' ||
                !cursor.className
            ) {
                continue;
            }

            if (
                /\b(?:secedit)\b/.test(cursor.className) &&
                endPos !== 'last' &&
                (sectionEditForm = cursor.getElementsByTagName('form').item(0)) &&
                (startPos = getRangeValue(sectionEditForm.lines, 'start')) !== false &&
                endPos < startPos
            ) {
                // out of the edit range
                break;
            }

            if (/\b(?:level\d)\b/.test(cursor.className)) {
                cursor.className += ' section_highlight';
            }
        }
    }
})();
