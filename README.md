## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

### Submission
The solution has been implemented and tested. The repository is ready for review.

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

## Solution

### Part 1: Due Dates
- Users can set a due date when creating a task.
- The due date is displayed in the task list.
- Overdue tasks are highlighted in red.

### Part 2: Image Generation
- When a task is created, the app fetches a relevant image from the Pexels API based on the task title.
- The image is displayed alongside the task in the task list.

### Part 3: Task Dependencies
- Users can specify dependencies when creating a task.
- Dependencies are displayed in the task list.
- The system prevents circular dependencies and calculates the critical path.

### Screenshots
![Task List with Due Dates and Images](path/to/screenshot1.png)
![Task Dependencies Visualization](path/to/screenshot2.png)

## How to Use Dependencies

### Selecting Dependencies
1. Navigate to the task creation or editing interface.
2. Use the multi-select dropdown to choose one or more tasks as dependencies for the current task.
3. Ensure that the selected dependencies do not create a circular dependency.

### Using the Dependency Graph
- Each task is represented as a node in the graph.
- Arrows indicate dependencies between tasks.
- Hover over a node to view additional details about the task.
- Click the delete button on a node to remove the task from the graph.

Thanks for your time and effort. We'll be in touch soon!
