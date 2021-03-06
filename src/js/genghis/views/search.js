Genghis.Views.Search = Backbone.View.extend({
    tagName: 'form',
    className: 'navbar-search form-search',
    template: Genghis.Templates.Search,
    events: {
        'keyup input#navbar-query': 'handleSearchKeyup',
        'click span.grippie':       'toggleExpanded',
        'dragmove span.grippie':    'handleGrippieDrag',
        'click button.cancel':      'collapseSearch',
        'click button.search':      'findDocumentsAdvanced'
    },
    initialize: function() {
        _.bindAll(
            this, 'render', 'updateQuery', 'handleSearchKeyup', 'findDocuments', 'findDocumentsAdvanced', 'focusSearch', 'blurSearch',
            'advancedSearchToQuery', 'queryToAdvancedSearch', 'expandSearch', 'collapseSearch', 'collapseNoFocus', 'toggleExpanded',
            'handleGrippieDrag'
        );

        this.model.bind('change', this.updateQuery);
        this.model.bind('change:collection', this.collapseNoFocus);
    },
    render: function() {
        $(this.el).html(this.template.render({query: this.model.get('query')}));
        $(this.el).submit(function(e) { e.preventDefault(); });

        $(document).bind('keydown', '/', this.focusSearch);

        var wrapper   = $(this.el);
        var resizable = wrapper.find('.well');
        var expand    = this.expandSearch;
        var collapse  = this.collapseSearch;
        $('.grippie', this.el).bind('mousedown', function(e) {
            e.preventDefault();

            var minHeight = 30;
            var maxHeight = Math.min($(window).height() / 2, 350);
            $(document).mousemove(mouseMove).mouseup(mouseUp);

            function mouseMove(e) {
                var mouseY = e.clientY + document.documentElement.scrollTop - wrapper.offset().top;

                if (mouseY >= minHeight && mouseY <= maxHeight) {
                    wrapper.height(mouseY + 'px');
                }

                if (wrapper.hasClass('expanded')) {
                    if (mouseY < minHeight) {
                        collapse();
                    }
                } else {
                    if (mouseY > 100) {
                        expand();
                    }
                }

                return false;
            }

            function mouseUp(e) {
                $(document).unbind('mousemove', mouseMove).unbind('mouseup', mouseUp);
                if (!wrapper.hasClass('expanded')) {
                    collapse();
                }
                e.preventDefault();
            }
        });

        return this;
    },
    updateQuery: function() {
        var q = this.normalizeQuery(this.model.get('query') || this.model.get('document') || '');

        this.$('input#navbar-query').val(q);
    },
    handleSearchKeyup: function(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.findDocuments($(e.target).val());
        } else if (e.keyCode == 27) {
            this.blurSearch();
        }
    },
    findDocuments: function(q) {
        var url = Genghis.Util.route(this.model.currentCollection.url + '/documents');

        q = q.trim();
        if (q.match(/^([a-z\d]+)$/i)) {
            url = url + '/' + q;
        } else {
            url = url + '?' + Genghis.Util.buildQuery({q: encodeURIComponent(Genghis.JSON.normalize(q, false))});
        }

        app.router.navigate(url, true);
    },
    findDocumentsAdvanced: function(e) {
        this.findDocuments(this.editor.getValue());
        this.collapseSearch();
    },
    focusSearch: function(e) {
        if (this.$('input#navbar-query').is(':visible')) {
            if (e) e.preventDefault();
            this.$('input#navbar-query').focus();
        } else if (this.editor && this.$('.well').is(':visible')) {
            if (e) e.preventDefault();
            this.editor.focus();
        }
    },
    blurSearch: function() {
        this.$('input#navbar-query').blur();
        this.updateQuery();
    },
    normalizeQuery: function(q) {
        q = q.trim();

        if (q !== '') {
            try {
                q = Genghis.JSON.normalize(q, false);
            } catch (e) {
                // do nothing, we'll use the un-normalized version.
            }
        }

        return q.replace(/^\{\s*\}$/, '')
                .replace(/^\{\s*(['"]?)_id\1\s*:\s*\{\s*(['"]?)\$id\2\s*:\s*(["'])([a-z\d]+)\3\s*\}\s*\}$/, '$4')
                .replace(/^\{\s*(['"]?)_id\1\s*:\s*(new\s+)?ObjectId\s*\(\s*(["'])([a-z\d]+)\3\s*\)\s*\}$/, '$4');
    },
    advancedSearchToQuery: function() {
        this.$('input#navbar-query').val(this.normalizeQuery(this.editor.getValue()));
    },
    queryToAdvancedSearch: function() {
        var q = this.$('input#navbar-query').val().trim();

        if (q.match(/^[a-z\d]+$/i)) {
            q = '{_id:ObjectId("'+q+'")}';
        }

        if (q !== '') {
            try {
                q = Genghis.JSON.normalize(q, true);
            } catch (e) {
                // Do nothing, we'll copy over the broken JSON
            }
        }

        this.editor.setValue(q);
    },
    expandSearch: function(expand) {
        if (!this.editor) {
            var wrapper = $('.search-advanced', this.el);
            this.editor = CodeMirror($('.well', this.el)[0], _.extend(Genghis.defaults.codeMirror, {
                lineNumbers: false,
                onFocus: function() { wrapper.addClass('focused');    },
                onBlur:  function() { wrapper.removeClass('focused'); },
                extraKeys: {
                    'Ctrl-Enter': this.findDocumentsAdvanced,
                    'Cmd-Enter':  this.findDocumentsAdvanced,
                    'Esc':        this.findDocumentsAdvanced
                 },
                 onChange:        this.advancedSearchToQuery
            }));
        }

        this.queryToAdvancedSearch();

        $(this.el).addClass('expanded');

        var editor      = this.editor;
        var focusSearch = this.focusSearch;
        _.defer(function() {
            editor.refresh();
            focusSearch();
        });
    },
    collapseSearch: function() {
        this.collapseNoFocus();
        this.focusSearch();
    },
    collapseNoFocus: function() {
        $(this.el).removeClass('expanded').css('height', 'auto');
    },
    toggleExpanded: function() {
        if ($(this.el).hasClass('expanded')) {
            this.collapseSearch();
        } else {
            this.expandSearch();
            $(this.el).height(Math.floor($(window).height() / 4) + 'px');
        }
    },
    handleGrippieDrag: function(e) {
        console.log(e);
    }
});
