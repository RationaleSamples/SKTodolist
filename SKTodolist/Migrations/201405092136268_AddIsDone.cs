namespace SKTodolist.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddIsDone : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.TodoItems", "IsDone", c => c.Boolean(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.TodoItems", "IsDone");
        }
    }
}
