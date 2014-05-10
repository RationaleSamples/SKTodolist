using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SKTodolist.Models
{
    public class TodoItemViewModel
    {
        public int Id { get; set; }

        public string Title { get; set; }

        public bool IsDone { get; set; }
    }
}