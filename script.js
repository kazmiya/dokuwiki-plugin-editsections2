/**
 * EditSections2 Plugin for DokuWiki / script.js
 * 
 * @author Kazutaka Miyasaka <kazmiya@gmail.com>
 */

// rewrite default edit section highlighting events
addInitEvent(function() {
    var btns = getElementsByClass('btn_secedit', document, 'form');

    for (var i = 0, i_len = btns.length; i < i_len; i++) {
        var edittarget = btns[i].edittarget ? btns[i].edittarget.value : 'plain';
        if (!edittarget.match(/^(?:plain|table)$/)) continue;

        var events = btns[i].events;

        // remove all of the previously-set mouseover/mouseout events on the button
        if (events) {
            var $$guid;
            for ($$guid in events.mouseover) {
                removeEvent(btns[i], 'mouseover', events.mouseover[$$guid]);
            }
            for ($$guid in events.mouseout) {
                removeEvent(btns[i], 'mouseout', events.mouseout[$$guid]);
            }
        }

        // add new event to highlight sections to be edited
        if (edittarget === 'plain') {
            addEvent(btns[i], 'mouseover', function(event) {
                var secedit_range = /^(\d+)-(\d*)$/;
                var tgt, form, secedit_start, secedit_end;

                // get the end position of the section
                tgt = event.target.form;
                if (!tgt.lines
                        || !tgt.lines.value
                        || !tgt.lines.value.match(secedit_range)) {
                    return;
                }
                if (RegExp.$2) secedit_end = parseInt(RegExp.$2);

                tgt = tgt.parentNode;
                if (tgt.tagName !== 'DIV') return;

                // add "section_highlight" class to DIV elements in the edit range
                while (tgt = tgt.nextSibling) {
                    if (tgt.tagName !== 'DIV') continue;
                    if (tgt.className.match(/\bsecedit\b/)) {
                        if (!secedit_end) continue;
                        form = tgt.getElementsByTagName('form').item(0);
                        if (!form
                                || !form.lines
                                || !form.lines.value.match(secedit_range)) {
                            continue;
                        }
                        secedit_start = parseInt(RegExp.$1);
                        if (secedit_end <= secedit_start - 1) return;
                    } else if (tgt.className.match(/\blevel\d\b/)) {
                        tgt.className += ' section_highlight';
                    }
                }
            });
        }

        // add new event to highlight a table to be edited
        if (edittarget === 'table') {
            addEvent(btns[i], 'mouseover', function(event){
                var tgt = event.target.form.parentNode;
                if (tgt.tagName !== 'DIV') return;
                tgt = tgt.nextSibling;
                if (tgt && tgt.tagName === 'TABLE') {
                    tgt.className += ' section_highlight';
                }
            });
        }

        // add new event to turn highlightings off (same as DokuWiki distro's)
        addEvent(btns[i], 'mouseout', function(event) {
            var secs = getElementsByClass('section_highlight');
            for (var j = 0, j_len = secs.length; j < j_len; j++) {
                secs[j].className = secs[j].className.replace(/\b\s*section_highlight\b/, '');
            }
        });
    }
});
