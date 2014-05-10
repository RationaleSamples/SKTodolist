using Microsoft.AspNet.SignalR;
using SKTodolist.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SKTodolist.Hubs
{
    public class TodoHub : Hub
    {
        private AppDbContext db = new AppDbContext();

        public TodoHub()
        {
            AutoMapper.Mapper.CreateMap<TodoItemViewModel, TodoItem>();
        }

        public TodoItem Add(string title)
        {
            var todoitem = db.TodoItems.Add(new TodoItem()
            {
                Title = title
            });

            db.SaveChanges();

            Clients.Others.taskAdded(new { todoitem.Id, todoitem.Title });

            return todoitem;
        }

        public TodoItem Toggle(int itemId)
        {
            var task = db.TodoItems.Find(itemId);
            if (task == null) return null;

            task.IsDone = !task.IsDone;
            db.Entry(task).State = System.Data.Entity.EntityState.Modified;
            db.SaveChanges();

            Clients.Others.taskToggled(task);

            return task;
        }

        public TodoItem Rename(int itemId, string title)
        {
            var task = db.TodoItems.Find(itemId);
            if (task == null) return null;

            task.Title = title;
            db.Entry(task).State = System.Data.Entity.EntityState.Modified;
            db.SaveChanges();

            Clients.Others.taskRenamed(task);
            return task;
        }

        public TodoItem Remove(int itemId)
        {
            var task = db.TodoItems.Find(itemId);
            if (task == null) return null;

            db.TodoItems.Remove(task);
            db.SaveChanges();

            Clients.Others.taskRemoved(task);
            return task;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}