# REQUIREMENTS AND USER STORIES (PRODUCT BACKLOG)

These requirements have been ranked according to order of priority. The
first rank being 1, which represents a requirement that is less
important up to the highest rank, being 10 representing a requirement
that is of most importance.

## 🧩 Functional Requirements

+--------+-------+-----------------------------------------------------+
| Iden   | Pri   | Requirement                                         |
| tifier | ority |                                                     |
+========+=======+=====================================================+
| REQ1   | 7     | The system shall allow researchers to create        |
|        |       | project listings and define requirements of the     |
|        |       | projects they have done or are currently working    |
|        |       | on.                                                 |
+--------+-------+-----------------------------------------------------+
| REQ2   | 3     | Researchers should be allowed to choose between     |
|        |       | making their project listings public, private or    |
|        |       | invite-only.                                        |
+--------+-------+-----------------------------------------------------+
| REQ3   | 10    | Reviewers should be able to suggest edits on        |
|        |       | projects that they are reviewing.                   |
+--------+-------+-----------------------------------------------------+
| REQ4   | 5     | The system should keep track of the history of      |
|        |       | edits made by a reviewer on a project to allow      |
|        |       | researchers to track and accept/reject changes.     |
+--------+-------+-----------------------------------------------------+
| REQ5   | 10    | Researchers should be able to connect with other    |
|        |       | researchers to work together on a particular        |
|        |       | project by inviting them through emails or through  |
|        |       | the platform's user search engine.                  |
+--------+-------+-----------------------------------------------------+
| REQ6   | 10    | The system should allow researchers to share        |
|        |       | documents and other resources with researchers that |
|        |       | they are collaborating with.                        |
+--------+-------+-----------------------------------------------------+
| REQ7   | 5     | The system should suggest potential collaborators   |
|        |       | based on past research interests, skills and        |
|        |       | project needs.                                      |
+--------+-------+-----------------------------------------------------+
| REQ8   | 1     | Users should be able to share/post updates on their |
|        |       | profiles about the project they are working on.     |
+--------+-------+-----------------------------------------------------+
| REQ9   | 2     | The system should allow researchers, reviewers and  |
|        |       | administrators to see posts made by other users and |
|        |       | comment on them if needed.                          |
+--------+-------+-----------------------------------------------------+
| REQ10  | 9     | Researchers should be able to track their project   |
|        |       | funding.                                            |
+--------+-------+-----------------------------------------------------+
| REQ11  | 8     | The system shall generate at least 3 reports,       |
|        |       | being:                                              |
|        |       |                                                     |
|        |       | -   Project completion reports every time a         |
|        |       |     researcher completes a project.                 |
|        |       |                                                     |
|        |       | -   Funding used vs funding available reports for   |
|        |       |     researchers to monitor their funds.             |
|        |       |                                                     |
|        |       | -   Custom view reports based on what a user        |
|        |       |     selects                                         |
+--------+-------+-----------------------------------------------------+
| REQ12  | 6     | Users should be able to export these reports as CSV |
|        |       | or PDF.                                             |
+--------+-------+-----------------------------------------------------+
| REQ13  | 6     | Users should be able to create their own profiles   |
|        |       | based on the type of users they are.                |
+--------+-------+-----------------------------------------------------+
| REQ14  | 7     | The system should use a third-party identity        |
|        |       | provider for user authentication.                   |
+--------+-------+-----------------------------------------------------+
| REQ15  | 8     | Users should be required to log in by entering      |
|        |       | their username and password every time they want to |
|        |       | use the system.                                     |
+--------+-------+-----------------------------------------------------+
| REQ16  | 6     | The system should allow for real-time communication |
|        |       | (Built-in messaging) between users that are         |
|        |       | connected to each other.                            |
+--------+-------+-----------------------------------------------------+
| REQ17  | 3     | Users should be able to add their information on    |
|        |       | their user profile.                                 |
+--------+-------+-----------------------------------------------------+
| REQ18  | 3     | Users should be allowed to choose their preferred   |
|        |       | profile visibility by either making it public,      |
|        |       | private, institution-only or invite-only.           |
+--------+-------+-----------------------------------------------------+
| REQ19  | 10    | Administrators should be able to manage users,      |
|        |       | oversee projects and handle reports.                |
+--------+-------+-----------------------------------------------------+

## 🧩 Non-Functional Requirements

+--------+-------+-----------------------------------------------------+
| Iden   | Pri   | Requirement                                         |
| tifier | ority |                                                     |
+========+=======+=====================================================+
| REQ1   | 10    | The system should be user friendly and easy to      |
|        |       | navigate.                                           |
+--------+-------+-----------------------------------------------------+
| REQ2   | 9     | The user interface should be intuitive and require  | 
|        |       | minimal training for new users.                     |
+--------+-------+-----------------------------------------------------+
| REQ3   | 3     | Users should be able to complete a common task      |
|        |       | (such as user registration) within 3 minutes.       |
+--------+-------+-----------------------------------------------------+
| REQ4   | 5     | The system should work smoothly on different web    | 
|        |       | browsers.                                           |
+--------+-------+-----------------------------------------------------+
| REQ5   | 4     | The system should be able to scale accordingly to   |
|        |       | accommodate an increasing number of users and       |
|        |       | shared resources.                                   |
+--------+-------+-----------------------------------------------------+
| REQ6   | 8     | The system should have regular data backups.        |
+--------+-------+-----------------------------------------------------+
| REQ7   | 7     | The system should be able to recover from failures  |
|        |       | and errors without losing data or disrupting user   |
|        |       | activities.                                         |
+--------+-------+-----------------------------------------------------+
| REQ8   | 1     | The system should be able to process file uploads   |
|        |       | within 10 seconds for files up to 100 mb.           |
+--------+-------+-----------------------------------------------------+
| REQ9   | 3     | The system should be able to retrieve information   |
|        |       | related to the text on the search engine within 5   |
|        |       | seconds.                                            |
+--------+-------+-----------------------------------------------------+
| REQ10  | 2     | The system's response time should be less than 2,   |
|        |       | with a minimum latency.                             |
+--------+-------+-----------------------------------------------------+
| REQ11  | 7     | The system should handle all user authentication    |
|        |       | via a third-party identity provider such as Google  |
|        |       | oath.                                               |
+--------+-------+-----------------------------------------------------+
| REQ12  | 10    | User passwords and other sensitive information      |
|        |       | should be encrypted to protect against unauthorized |
|        |       | access.                                             |+----------------------------------------------------------------------+
| REQ13  | 6     | The system should automatically log out a user if   |
|        |       | they are inactive for over 15 minutes.              |
+--------+-------+-----------------------------------------------------+


## 🧩 User Stories

These user stories have been ranked according to order of priority. The
first rank being 1, which represents a requirement that is less
important up to the highest rank, being 10 representing a requirement
that is of most importance.

+--------+-------+-----------------------------------------------------+
| Iden   | Size  | User Story                                          |
| tifier |       |                                                     |
+========+=======+=====================================================+
|  1     | 7     | As a researcher, I can invite other researchers so  |
|        |       | that we can collaborate on a certain project.       |
+--------+-------+-----------------------------------------------------+
|  2     | 9     | As a researcher, I can share documents with other   | 
|        |       | researchers so that we can work on them together.   |
+--------+-------+-----------------------------------------------------+
|  3     | 3     | As a researcher, I can message other researchers    |
|        |       | or reviewers so that I can effectively communicate  |
|        |       | on a real-time frame with them.                     |
+--------+-------+-----------------------------------------------------+
|  4     |  10   | As a researcher, I can manage the different research| 
|        |       | projects that I have so that I can effectively      |
|        |       | complete them the way that I desire.                |
+--------+-------+-----------------------------------------------------+
|  5     |  8    | As a researcher, I can track project milestones so  |
|        |       | that I can monitor progress and ensure timely       |
|        |       | completion of my research.                          |
+--------+-------+-----------------------------------------------------+
|  6     |  6    | As a researcher, I can track my project funding so  |
|        |       | that I can manage expenses effectively and ensure   |
|        |       | sufficient resources are available to complete my   |
|        |       | project.                                            |
+--------+-------+-----------------------------------------------------+
|  7     |  7    | As a researcher, I can generate reports so that I   |
|        |       | can analyze progress, share findings and keep       |
|        |       | stakeholders informed.                              |
+--------+-------+-----------------------------------------------------+
|  8     |  10   | As a reviewer, I can review research projects so    |
|        |       | that I can assess their quality, validity and       |
|        |       | adherence to guidelines.                            |
+--------+-------+-----------------------------------------------------+
|  9     |  10   | As a reviewer, I can provide feedback on research   |
|        |       | projects so that researchers can improve their work |
|        |       | based on the recommendations I made.                |
+--------+-------+-----------------------------------------------------+
|  10    |  7    | As a reviewer, I can identify and highlight issues  |
|        |       | and risks in research projects so that potential    |
|        |       | problems can be addressed before the research       |
|        |       | project is submitted.                               |
+--------+-------+-----------------------------------------------------+
|  11    |  3    | As a reviewer, I can message researchers and other  |
|        |       | reviewers so that I can collaborate and discuss     |
|        |       |project evaluations effectively.                     |
+--------+-------+-----------------------------------------------------+
|  12    |  6    | As a reviewer, I can generate reports so that I can |
|        |       | document my assessments, feedback and see the       |
|        |       | projects that I have reviewed.                      |+----------------------------------------------------------------------+
|  13    |  9    | As an administrator, I can manage user accounts so  |
|        |       | that I can enforce system regulations.              |
+--------+-------+-----------------------------------------------------+
|  14    |  8    | As an administrator, I can maintain platform        |
|        |       | functionality so that users can access and use the  |
|        |       | system’s features effectively.                      |
+--------+-------+-----------------------------------------------------+
|  15    |  8    | As an administrator, I can resolve user issues so   |
|        |       | that I can ensure a smooth experience for all users.|+----------------------------------------------------------------------+
