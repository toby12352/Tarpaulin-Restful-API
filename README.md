# Tarpaulin Restful API #

In this repository, I lead a team of 3 software engineers and implemented a RESTful API for an application called Tarpaulin. Tarupaulin is a lightweight course management tool that's an alternative to Canvas.

My role: 
  * Organize and assign tasks to each member
  * Connecting Docker and Node.js
  * Authorization for Users
  * Database management
  * HTTP REQUESTS

Language and Tools: Node.js, Javascript, MongoDB, Docker, Github
Testing Tool: Insomnia

# Entities #

*`Users` - This represents Tarpaulin application users. Each user have one of three roles: `admin`, `instructor` and `student`. Each role represents a different set of perimssions to perform certain API actions.

*`Courses` - These represents courses being managed in Tarpaulin. Each course have basic information, such as subject code, number, title, instructor, etc. Each course also has associated data of other entity types, incuding a list of enrolled students (i.e. Tarpaulin Users with `student` roles) as well as a set of assignments.

*`Assignments` - These represent a single assignment for a Tarpaulin Course. Each Assignment belongs to a specific Course and has basic information such as title, due date, etc. It also has a list of individual student submissions.

*`Submissions` - These represent a single student submission for an Assignment in Tarpaulin. Each submission belongs both to its  Assignment to the student who submitted it, and it is marked with a subimssion timestamp. Each submission is also associated with a specific file, which will be uploaded to the Tarpaulin API and stored, so it can be downloaded later.

# Docker #

All services used by Tarpaulin API runs in Docker Containers (MongoDB).

For more information and better visualization of how the Tarpaulin Restful API works, refer to this website below:
<https://editor.swagger.io>

# Tools require to run: #
1. `Clone to your local computer`
2. `Install Docker Container (MongoDB)`
3. `npm install`

# Instruction on how to run: #
1. `Run container on Docker`
2. `npm run dev`


# Github Commands #
__________________________________________
If you want to update your local branch

  $git pull origin {branch name you want to pull}
  
                  OR
                  
If you want to pull from 'main' branch

  $git pull
  
-------------------------------------------------------------------------------
create your own branch:
  `$ git checkout -b [name your branch here] main`
  
for example:
  `$ git checkout -b final-project-myname main`

-------------------------------------------------------------------------------

commit changes:
  `$ git commit -a -m [commit message here]`
  
for example:
 `$ git commit -a -m "i changed the color to green!"`
