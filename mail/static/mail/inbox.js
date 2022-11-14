document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', new_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-content-view').style.display = 'block';

    document.querySelector('#email-content-view').innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong>: ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>

      <hr>
      ${email.body}<br><br>
    `
    
    // If the mail is opened, set to read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })

    // Archive the mail
    const archive_button = document.createElement('button');
    archive_button.className = "d-grid gap-2 d-md-block"
    if (email.archived) {
      archive_button.className = "btn btn-secondary"
      archive_button.innerHTML = 'Unarchive'
    } else {
      archive_button.className = "btn btn-primary"
      archive_button.innerHTML = 'Archive'
    }

    archive_button.addEventListener('click', function() {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived 
        })
      })
      .then(()=>view_email(id))
    });
    document.querySelector('#email-content-view').append(archive_button);

    // Reply button
    const reply_button = document.createElement('button');
    reply_button.innerHTML = 'Reply';
    reply_button.className = "btn btn-success";
    reply_button.addEventListener('click', function(event) {
      event.preventDefault();
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'block';
      document.querySelector('#email-content-view').style.display = 'none';

      document.querySelector('#compose-recipients').value = email.sender
      let subject = email.subject;
      if (subject.split(" ")[0] != 'Re:') {
        subject = 'Re: ' + subject;
      }
      document.querySelector('#compose-subject').value = subject
      document.querySelector('#compose-body').value = `
        On ${email.timestamp} ${email.sender} wrote: ${email.body} 
      `

      document.querySelector('#compose-form').addEventListener('submit', new_email);
      
    });
    document.querySelector('#email-content-view').append(reply_button);
  });
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the email API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(mail => {
      

      // Create div for each email
      const newEmail = document.createElement('div');
      newEmail.className = 'list-group-item'
      newEmail.innerHTML = `
      <p>From: ${mail.sender}</p>
      <p>Subject: ${mail.subject}</p>
      <p>Time: ${mail.timestamp}</p>
      `
      
      // Change background color
      if (mail.read) {
        // Make it gray
        newEmail.className = 'list-group-item list-group-item-secondary'
      } else {
        // Make it white
        newEmail.className = 'list-group-item list-group-item-light'
      }
      
      // Add click event listener to the div
      newEmail.addEventListener('click', function() {
        view_email(mail.id)
      })
      
      document.querySelector('#emails-view').append(newEmail);
    });
  });
}



function new_email(event) {
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}

