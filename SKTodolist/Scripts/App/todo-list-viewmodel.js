$(function () {
    //==================================================================
    //  No cache need in AJAX requests (for testing)
    //==================================================================

    $.ajaxSetup({ cache: false });

    //==================================================================
    //  The todo list item modeled in JS
    //==================================================================
    
    var TodoListItem = function (title, id, isDone) {
        /* Each item should be observable for DOM interaction */
        this.Id = ko.observable(); 
        this.Title = ko.observable();
        this.IsDone = ko.observable();

        /* State vars */
        this.IsEditing = ko.observable(false);
        this.EditingValue = ko.observable("");

        /* Setup */
        if (typeof (arguments[0]) == "object") { // Received an item JSON container
            var task = arguments[0];
            
            this.Id(typeof (task.Id) == "undefined" ? 0 : task.Id);
            this.Title(task.Title);
            this.IsDone(typeof (task.IsDone) == "undefined" ? false : task.IsDone);
        } else {
            this.Id(typeof (id) == "undefined" ? 0 : id);
            this.Title(title);
            this.IsDone(typeof (isDone) == "undefined" ? false : isDone);
        }
    }

    //==================================================================
    //  Define a service which can communicate with the
    //  server by using WebAPI or SignalR
    //==================================================================

    var TodoListService = function () {
        var addTask = function (title) {
            if (_allowRealtimeCommunication()) {
                return $.connection.todoHub.server.add(title)
                    .done(function () {
                        toastr.info("A new task added (" + title + ").");
                    });
            } else {
                return $.when(
                    _ajaxPromise("/Api/Todo", { Title: title }, "POST")
                    ).done(function () {
                        toastr.info("A new task added (" + title + ").");
                    });
            }
        };

        var toggle = function (item) {
            if (_allowRealtimeCommunication()) {
                return $.connection.todoHub.server.toggle(item.Id())
                    .done(function (result) {
                        if (result.IsDone) {
                            toastr.success("The item " + item.Title() + " was marked as done.");
                        } else {
                            toastr.warning("The item " + item.Title() + " was marked as un-done.");
                        }
                    });
            } else {
                return $.when(
                    _ajaxPromise("/Api/Todo", { Id: item.Id(), Title: item.Title(), IsDone: !item.IsDone() }, "PUT")
                    ).done(function (result) {
                        if (result.IsDone) {
                            toastr.success("The item " + item.Title() + " was marked as done.");
                        } else {
                            toastr.warning("The item " + item.Title() + " was marked as un-done.");
                        }
                    });
            }
        };

        var renameTask = function (item) {
            if (_allowRealtimeCommunication()) {
                return $.connection.todoHub.server.rename(item.Id(), item.EditingValue())
                    .done(function () {
                        toastr.info("The task " + item.Title() + " has been renamed to " + item.EditingValue() + ".");
                    });
            } else {
                console.log({ Id: item.Id(), Title: item.EditingValue(), IsDone: item.IsDone() });
                return $.when(
                    _ajaxPromise("/Api/Todo", { Id: item.Id(), Title: item.EditingValue(), IsDone: item.IsDone() }, "PUT")
                    ).done(function () {
                        toastr.info("The task " + item.Title() + " has been renamed to " + item.EditingValue() + ".");
                    });
            }
        };

        var removeTask = function (item) {
            if (_allowRealtimeCommunication()) {
                return $.connection.todoHub.server.remove(item.Id())
                    .done(function () {
                        toastr.info("The task " + item.Title() + " has been removed.");
                    });
            } else {
                return $.when(
                    _ajaxPromise("/Api/Todo/" + item.Id(), {}, "DELETE")
                    ).done(function () {
                        toastr.info("The task " + item.Title() + " has been removed.");
                    });
            }
        };


        var _allowRealtimeCommunication = function () {
            return typeof (ALLOW_SIGNALR) != "undefined"
             && ALLOW_SIGNALR === true;
        };

        var _ajaxPromise = function(url, dataToSave, httpVerb) {
            return $.ajax(url, {
                data: ko.toJSON(dataToSave),
                type: httpVerb,
                dataType: 'json',
                contentType: 'application/json'
            }).fail(function () {
                toastr.error("An unexcepted AJAX error occured.");
            });
        };

        return {
            addTask: addTask,
            toggle: toggle,
            renameTask: renameTask,
            removeTask: removeTask
        }
    };

    //==================================================================
    //  The View Model
    //==================================================================

    var TodoListViewModel = function()
    {
        //---------------------------------------------------------------
        //  Define ivars
        //---------------------------------------------------------------
        var self = this;

        self.initialized = ko.observable(false);

        self.items = ko.observableArray([]);
        self.addedTaskValue = ko.observable("");
        self.todoListService = new TodoListService();

        //---------------------------------------------------------------
        //  Define interaction methods
        //---------------------------------------------------------------
        self.add = function () {
            if (self.addedTaskValue().trim() == "") {
                toastr.error("Could not create an empty task.");
                return;
            }

            self.todoListService.addTask(self.addedTaskValue())
                .done(function (result) {
                    self.items.push(new TodoListItem(result));
                    self.addedTaskValue("");
                });
        };

        self.toggle = function () {
            if (this.IsEditing()) return; // we should not be here if we're in edit mode

            self.todoListService.toggle(this)
                .done($.proxy(function (result) {
                    this.IsDone(result.IsDone);
                }, this));
        };

        self.beginEdit = function (sender, e) {
            e.stopPropagation(); // We should stop propagation, otherwise the toggle handler will be fired next
            
            this.IsEditing(true);
        };

        self.rollbackEdit = function (sender, e) {
            e.stopPropagation(); // We should stop propagation, otherwise the toggle handler will be fired next

            this.IsEditing(false);
        }

        self.commitEdit = function (sender, e) {
            e.stopPropagation(); // We should stop propagation, otherwise the toggle handler will be fired next
            
            /* Same value? */
            if (this.EditingValue().trim() == ""
                || this.EditingValue().trim() == this.Title().trim()) {
                this.IsEditing(false);
                return;
            }

            self.todoListService.renameTask(this)
                .done($.proxy(function () {
                    this.Title(this.EditingValue());
                    this.IsEditing(false);
                    this.EditingValue("");
                }, this));
        }

        self.remove = function (sender, e) {
            e.stopPropagation(); // We should stop propagation, otherwise the toggle handler will be fired next

            self.todoListService.removeTask(this)
                .done($.proxy(function () {
                    self.items.remove(this);
                }, this));
        };

        //---------------------------------------------------------------
        //  Define a default behavior to fetch the tasks
        //---------------------------------------------------------------
        ko.computed(function () {
            $.getJSON("/Api/Todo", function (tasks) {
                self.items(ko.utils.arrayMap(tasks, function (item) {
                    return new TodoListItem(item);   
                }));
            });
        }, self);

        //---------------------------------------------------------------
        //  SignalR
        //---------------------------------------------------------------
        if (typeof (ALLOW_SIGNALR) && ALLOW_SIGNALR === true) {
            $.connection.hub.start().done(function () {
                toastr.success("Connection established.", "Real-Time Communication", { hideDuration: 300 });
                self.initialized(true);
            }).fail(function () {
                toastr.success("Could not establish a connection with the server.", "Real-Time Communication", { hideDuration: 300 });
            });

            //---------------------------------------------------------------
            //  Create notification handlers for modifications by other clients
            //---------------------------------------------------------------

            /* Task added by other client */
            $.connection.todoHub.client.taskAdded = function (item) {
                self.items.push(new TodoListItem(item));
                toastr.info("A new task added (" + item.Title() + ").");
            }
            
            /* Task toggled by other client */
            $.connection.todoHub.client.taskToggled = function (item) {
                var koItem = ko.utils.arrayFilter(self.items(), function (i) {  return i.Id() == item.Id; });
                if (koItem.length != 1) { $.error("Could not find the requested item."); return; }

                koItem[0].IsDone(item.IsDone);

                if (item.IsDone) {
                    toastr.success("The item " + item.Title + " was marked as done.");
                } else {
                    toastr.warning("The item " + item.Title + " was marked as un-done.");
                }
            };

            /* Task renamed by other client */
            $.connection.todoHub.client.taskRenamed = function (item) {
                var koItem = ko.utils.arrayFilter(self.items(), function (i) {  return i.Id() == item.Id; });
                if (koItem.length != 1) { $.error("Could not find the requested item."); return; }

                koItem[0].Title(item.Title);
                
                toastr.info("The task " + koItem[0].Title() + " has been renamed to " + koItem[0].EditingValue() + ".");
            };

            /* Task removed by other client */
            $.connection.todoHub.client.taskRemoved = function (item) {
                self.items.remove(function (i) { return i.Id() == item.Id; });

                toastr.info("The task " + item.Title() + " has been removed.");
            };
        } else {
            self.initialized(true);
        }
    };
    
    ko.applyBindings(new TodoListViewModel());
}(jQuery));