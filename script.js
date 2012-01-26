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
            });
    }

    /**
     * Returns start/end value of the section edit range
     */
    function getRangeValue(range, startOrEnd) {
        var matched;

        if (range && (matched = /^(\d+)-(\d*)$/.exec(range.value))) {
            if (startOrEnd === 'start') {
                return Number(matched[1]);
            } else {
                return matched[2].length ? Number(matched[2]) : 'last';
            }
        } else {
            return false;
        }
    }

    /**
     * Scans and adds section edit id lookup table
     */
    function addEditIdLookupTable(sectionEditForm) {
        var parent, idMatched, startPos;

        parent = sectionEditForm.parentNode;

        if (
            parent &&
            parent.tagName === 'DIV' &&
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
        return /^H[1-6]/.test(element.tagName);
    }

    /**
     * Highlights sections in the edit range
     */
    function highlightSections(event) {
        var sectionEditForm, endPos, stopClass, stopClassRegExp, cursor,
            doNotHighlightHeadings;

        sectionEditForm = event.target.form;

        if (!sectionEditForm) {
            return;
        }

        endPos = getRangeValue(sectionEditForm.range, 'end');

        if (
            typeof endPos === 'number' &&
            editIdLookup[endPos + 1]
        ) {
            stopClass = 'sectionedit' + editIdLookup[endPos + 1];
        } else if (endPos === 'last') {
            stopClass = null;
        } else {
            return;
        }

        cursor = sectionEditForm.parentNode;

        doNotHighlightHeadings =
            JSINFO.plugin_editsections2.highlight_target === 'exclude_headings';

        if (stopClass === null) {
            // highlight rest of the page contents
            while (cursor = cursor.nextSibling) {
                if (cursor.className === 'footnotes') {
                    break;
                }

                if (doNotHighlightHeadings && isHeading(cursor)) {
                    continue;
                }

                cursor.className += ' section_highlight';
            }
        } else {
            stopClassRegExp = new RegExp(
                '\\b' + stopClass.replace(/(\W)/g, '\\$1') + '\\b'
            );

            // highlight until the stopClass appeared
            while (cursor = cursor.nextSibling) {
                if (
                    cursor.className === 'footnotes' ||
                    stopClassRegExp.test(cursor.className)
                ) {
                    break;
                } else if (doNotHighlightHeadings && isHeading(cursor)) {
                    continue;
                } else {
                    cursor.className += ' section_highlight';
                }
            }
        }
    }

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /**
     * Replaces mouseover events on section edit buttons
     * (for DokuWiki Anteater and Rincewind)
     */
    function replaceSectionEditButtonEvents_Anteater() {
        var i, iMax, parent, events, guid, buttonForms, sectionEditForms = [];

        buttonForms = getElementsByClass('btn_secedit', document, 'form');

        // extract section edit forms
        for (i = 0, iMax = buttonForms.length; i < iMax; i++) {
            parent = buttonForms[i].parentNode;

            // parent element must be 'div.editbutton_section'
            if (
                parent &&
                parent.tagName === 'DIV' &&
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
        var i, iMax, events, guid, buttonForms;

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
        var buttonForm, endPos, cursor, sectionEditForm, startPos;

        buttonForm = event.target.form;

        // get the end position of the section
        endPos = getRangeValue(buttonForm.lines, 'end');

        if (endPos === false) {
            return;
        }

        cursor = buttonForm.parentNode;

        if (cursor.tagName !== 'DIV') {
            return;
        }

        // add "section_highlight" class to DIV elements in the edit range
        while (cursor = cursor.nextSibling) {
            if (cursor.tagName !== 'DIV' || !cursor.className) {
                continue;
            }

            if (/\bsecedit\b/.test(cursor.className)) {
                if (endPos === 'last') {
                    continue;
                }

                sectionEditForm = cursor.getElementsByTagName('form').item(0);

                if (!sectionEditForm) {
                    continue;
                }

                startPos = getRangeValue(sectionEditForm.lines, 'start');

                if (startPos === false) {
                    continue;
                }

                // out of the edit range
                if (endPos < startPos) {
                    return;
                }
            } else if (/\blevel\d\b/.test(cursor.className)) {
                cursor.className += ' section_highlight';
            }
        }
    }
})();
