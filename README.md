# Shui Anslagstavla
A simple and user-friendly digital notice board.

## Features
### 1. View and interact with messages
**View Messages**: When you open the site, you will see all the posts that have been submitted by users. The messages are sorted, making it easy to view the latest or oldest posts first.
* **Sorting**: You can toggle between sorting messages based on:
  * **Newest First**: The default setting that displays the most recent posts at the top.
  * **Oldest First**: Switch the sorting to view the oldest posts at the top.
### 2. Filter messages by user
* **Filtering**: Do you want to see messages from a specific user? Use the filtering field to search for a particular username and display only their messages.
### 3. Post new messages
* **Post a Message**: Fill in your username and write your message (up to 75 characters). Once you click the "Submit" button, your message will appear on the notice board, along with your username and the time of submission.
* After submitting, a confirmation message will display along with a unique ID. This ID can be used later if you want to edit your post.
### 4. Edit your posts
* **Edit Messages**: If you have posted a message and want to edit it, click the Edit Message button next to your post.
* To edit the post, you will need to:
  * Enter the unique message ID (provided when you posted).
  * Write the new text and click "Save" to update your post.
### 5. Responsive design
The site is responsive and adapts to mobile devices, so you can easily read and post messages from your phone.
## Technical Information
The website is built using **React** for the frontend, with a serverless backend hosted on **AWS**. The backend handles posts and edits through **API Gateway** and **Lambda** functions, which store and retrieve data from a **DynamoDB** database.
Frontend files are hosted on **S3**, and the site is configured to handle dynamic routing using **React Router**.
