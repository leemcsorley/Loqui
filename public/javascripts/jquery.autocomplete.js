(function($) {
    // options:
    // ------------------------------------
    // url: the url of the search service
    // param: the query parameter name. default: "str"
    // noResults: the html to display if there are no results
    // result(obj): the html function to display for each result
    // token(text); the html function to display the token
    // id: the property name of the 'id' field
    // name: the property name of the 'name' field
    // separator: the separator of the ids/text that the form field is set to
    // newPrefix: the prefix to attach to the value of a 'new' item (to distinguish it from an existing id)
    // width: the width of the input control
    // fill: fill width
    $.fn.autoComplete = function (options) {
        // defaults
        if (!options.param) options.param = "str";
        if (!options.noResults) options.noResults = "<div>No Results. Press <b>'comma'</b> to add.</div>";
        if (!options.id) options.id = "id";
        if (!options.name) options.name = "name";
        if (!options.separator) options.separator = ",";
        if (!options.newPrefix) options.newPrefix = "*";
        if (!options.result) options.result = function(obj) {
            return "<div class='autocomplete-menu-icons'>" +
                "<icon class='icon-user'></icon>User<span>|</span>" +
                "<icon class='icon-ok'></icon>Following" +
                "</div><img src='" + obj.img + "'/><div><span class='autocomplete-name'><b>"
                + obj.name + "</b></span><span>" + obj.caption + "</span></div>";
        };
        if (!options.fill) options.fill = true;
        if (!options.width) options.width = 450;
        if (!options.token) options.token = function(text) {
            return "<div><a href='#' class='btn btn-tiny autocomplete-tokenbtn'><icon class='icon-unlock'></icon></a> <span>" + text + "</span><a href='#'>×</a></div>";
        };
        return this.each(function() {

            var $this = $(this),
                showing = false,
                selected = null,
                items = new Array(),
                ids = new Object(),
                name = $this.attr("name"),
                boxStr = '<div class="autocomplete-box" ></div>',
                containerStr = '<div class="autocomplete-container" ></div>',
                menuStr = '<div class="autocomplete-menu"></div>',
                hiddenStr = '<input type="hidden" name="' + name + '" />',
                results = false;

            $this.wrap($(boxStr));
            var box = $this.parent();
            box.wrap($(containerStr));
            var container = box.parent();
            var fbox = box.wrap($('<div></div>')).parent();
            var hidden = box.after($(hiddenStr)).next();
            var menu = hidden.after($(menuStr)).next();

            $this.attr("name", "");

            if (options.fill)
                options.width = container.width();
            box.width(options.width);
            menu.width(box.width() + 3);

            var refresh = function () {
                $this.focus();
                showing = false;
                selected = null;
                hidden.val(items.map(function(i) { return i.id; }).join(options.separator));
                var right = 0;
                if (items.length > 0) {
                    var item = items[items.length - 1].item;
                    right = item.position().left + item.width();
                }
                var w = options.width - 30 - right;
                if (w > 50)
                    $this.width(w);
                else
                    $this.width(options.width - 30);
                menu.css("top", box.height() + 6);
                menu.hide();
            };

            var select = function(id, text, isnew) {
                $this.width(1);
                $this.val("");
                var item = $(options.token(text));
                if (isnew)
                    item.addClass("autocomplete-new")
                item.find("a").click(function() {
                    // remove
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].item == item) {
                            delete ids[items[i].id];
                            items.splice(i, 1);
                        }
                    }
                    item.remove();
                    refresh();
                    return false;
                });
                items.push({ item: item, id: id });
                ids[id] = true;
                $this.before(item);
                refresh();
            };

            box.click(function(){ refresh(); });

            $this.bind('focusout', function (e) {
                if (!selected)
                {
                    showing = false;
                    menu.hide();
                }
                box.removeClass('focus');
            });

            $this.bind('focusin', function(e) {
               box.addClass('focus');
            });

            $this.bind('keydown', function (e) {
               var keyCode = e.keyCode || e.which,
                   keys = { left: 37, up: 38, right: 39, down: 40, back: 8, enter: 13, tab: 9, space: 32, comma: 188  };
                   switch (keyCode) {
                       case keys.comma:
                           if ($this.val() != "")
                                select(options.newPrefix + $this.val(), $this.val(), true);
                           return false;
                           break;
                       case keys.back:
                           if ($this.val() == "" && items.length > 0) {
                               var item = items.pop();
                               item.item.remove();
                               delete ids[item.id];
                               refresh();
                               e.preventDefault();
                               return false;
                           }
                           break;
                       case keys.tab:
                       case keys.enter:
                           if (selected)
                               select(selected.attr("data-id"), selected.attr("data-name"));
                            return false;
                           break;
                       case keys.left:
                           break;
                       case keys.right:
                           break;
                       case keys.up:
                           if (!selected) {

                           } else {
                               var nsel = selected.prev();
                               if (nsel.length > 0) {
                                   selected.toggleClass("autocomplete-on");
                                   nsel.toggleClass("autocomplete-on");
                                   selected = nsel;
                               }
                           }
                           break;
                       case keys.down:
                           if (!selected && results) {
                               selected = menu.children(":first");
                               selected.toggleClass("autocomplete-on");
                           } else {
                               var nsel = selected.next();
                               if (nsel.length > 0) {
                                   selected.toggleClass("autocomplete-on");
                                   nsel.toggleClass("autocomplete-on");
                                   selected = nsel;
                               }
                           }
                           break;
                   }
            });

            // bind to the text change event
            $this.bind('textchange', function(event, prev) {
                var val = $this.val();
                if (!showing && val) {
                    // show the menu
                    menu.show();
                    showing = true;
                }
                selected = null;
                $.getJSON(options.url + "?" + options.param + "=" + val, function(data) {
                    if (data.length == 0) {
                        menu.html(options.noResults);
                        results = false;
                    } else {
                        menu.children().remove();
                        results = true;
                        data.forEach(function (obj) {
                           if (!ids[obj[options.id]])
                                menu.append("<div class='autocomplete-menuitem' data-id='" + obj[options.id] + "' data-name='" + obj[options.name] + "'>" + options.result(obj) + "</div>");
                        });
                        menu.children().bind("mouseover", function(e) {
                            $(this).toggleClass("autocomplete-on");
                            selected = $(this);
                        });
                        menu.children().bind("mouseout", function(e) {
                            if (selected) {
                                selected.toggleClass("autocomplete-on");
                                selected = null;
                            }
                        });
                        menu.children().click(function(e) {
                            select($(this).attr("data-id"), $(this).attr("data-name"));
                        });
                    }
                });
            });
        });
    };
})(jQuery);