
# Prompts for designing the app, please go to docs folder, open required file and give the prompt with %K

## Create description of your app idea at description.md
Please provide a concise and compact description of following app idea:
"Your idea here"
Shortly describe the use cases and features of the app.

## Create architecture at architecture.md

Please describe the architecture of app defined in @description.md. Make decisions of which frameworks and databases to use for frontend and backend, including javascript and css frameworks. Also plan and document the unit tests and acceptance test framework for both frontend and backend. Emphasise quick time to market and easy deployment.

Fullfill these needs:
- Use nvm and node version 20
- App needs to run in web, iphone and android
- Use social logins instead of username password

# Create datamodel at datamodel

Please design a datamodels based on @description.md and @architecture.md. Describe e.g. data model entities (tables, indexes, docs) and their attributes and relations.

# Frontend design

Please describe a textual frontend design and description based on @description.md, @architecture.md and @datamodel.md. List all views and their purposes and describe the overall styling and look and feel.

# Backend design
Please describe a textual backend design and description based on @description.md, @architecture.md, @datamodel.md and @frontend.md. List all API endpoints, their purposes, authentication, and describe the overall backend architecture and components. List also non-functional requirements.

# Create todo
Please create a todo list based on @description.md, @architecture.md, @datamodel.md, @frontend.md and @backend.md. List all tasks needed to implement the app. Group tasks by logical areas and mark their status (✅ done, ⏳ in progress, ❌ not started). Add also next priority tasks at the end. Prefer full stack tasks.

Example:
1. ✅ Project Setup
   - ✅ Initialize project
   - ⏳ Configure environments
   - ❌ Setup CI/CD

2. ⏳ Authentication
   - ✅ Implement login
   - ❌ Add user profiles

