using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SKTodolist.Models
{
    public class TodoItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        public bool IsDone { get; set; }

        [Required]
        public DateTime CreationDate { get; set; }


        public TodoItem()
        {
            this.CreationDate = DateTime.UtcNow;
            this.IsDone = false;
        }
    }
}