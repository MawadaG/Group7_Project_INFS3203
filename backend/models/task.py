class Task:
    def __init__(
        self,
        title,
        description="",
        due_date=None,
        priority="low",
        status="pending",
        project_id=None,
        subtasks=None
    ):
        self.title = title
        self.description = description
        self.due_date = due_date
        self.priority = priority
        self.status = status
        self.project_id = project_id
        self.subtasks = subtasks if subtasks is not None else []

    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date,
            "priority": self.priority,
            "status": self.status,
            "project_id": self.project_id,
            "subtasks": self.subtasks
        }