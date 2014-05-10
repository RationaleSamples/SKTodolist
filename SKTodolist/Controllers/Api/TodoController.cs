using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;
using SKTodolist.Models;

namespace SKTodolist.Controllers.Api
{
    public class TodoController : ApiController
    {
        private AppDbContext db = new AppDbContext();

        public TodoController()
        {
            AutoMapper.Mapper.CreateMap<TodoItemViewModel, TodoItem>();
        }

        // GET api/Todo
        public IQueryable<TodoItem> GetTodoItems()
        {
            return db.TodoItems;
        }

        // GET api/Todo/5
        [ResponseType(typeof(TodoItem))]
        public IHttpActionResult GetTodoItem(int id)
        {
            TodoItem todoitem = db.TodoItems.Find(id);
            if (todoitem == null)
            {
                return NotFound();
            }

            return Ok(todoitem);
        }

        // PUT api/Todo/5
        [ResponseType(typeof(TodoItem))]
        public IHttpActionResult PutTodoItem(TodoItemViewModel todoitem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var task = db.TodoItems.Find(todoitem.Id);
            if (task == null)
            {
                return NotFound();
            }

            task.Title = todoitem.Title;
            task.IsDone = todoitem.IsDone;
            db.SaveChanges();

            return Ok(task);
        }

        // POST api/Todo
        [ResponseType(typeof(TodoItem))]
        public IHttpActionResult PostTodoItem(TodoItemViewModel todoitem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var task = AutoMapper.Mapper.Map<TodoItem>(todoitem);
            task = db.TodoItems.Add(task);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = todoitem.Id }, task);
        }

        // DELETE api/Todo/5
        [ResponseType(typeof(TodoItem))]
        public IHttpActionResult DeleteTodoItem(int id)
        {
            TodoItem todoitem = db.TodoItems.Find(id);
            if (todoitem == null)
            {
                return NotFound();
            }

            db.TodoItems.Remove(todoitem);
            db.SaveChanges();

            return Ok(todoitem);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool TodoItemExists(int id)
        {
            return db.TodoItems.Count(e => e.Id == id) > 0;
        }
    }
}