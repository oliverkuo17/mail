document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = send;
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = email.sender;
  let subject = email.subject;
  if(!subject.startsWith("Re: ")) {
    subject = `Re: ${subject}`;
  }
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${'-'.repeat(50)} \n${email.body}`;
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  let nav_btn = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < nav_btn.length; i++) {
      let self = nav_btn[i];
      self.style.borderBottom = '4px solid transparent'
    }

  document.querySelector(`#${mailbox}`).style.borderBottom = '4px solid red';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);
    emails.forEach(email => {
      const emailDiv = document.createElement("div");
      if (mailbox === 'sent') {
        var name_showed = email.recipients[0];
      } else {
        name_showed = email.sender;
      }
      emailDiv.className = "mailbox-email"
      emailDiv.innerHTML =
          `<div>
            <span style="margin-left: 20px; width: 200px; display: inline-block">${name_showed}</span>
            <span>${email.subject}</span>
            <span style="margin-right: 20px; float: right;">${email.timestamp}</span>
          </div>`

      if (email.read) {
        emailDiv.style.fontWeight = 'normal';
      }

      emailDiv.addEventListener('click', function() {

        fetch(`/emails/${email.id}`)
            .then(response => response.json())
            .then(email => {
                // set this email to read by sending a PUT request
                if (!email.read) {
                  fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({read: true})
                })
                  .then(response => {console.log(`PUT status for updating read state returned status code ${response.status}`)})
                }
                // load the details of the email onto the page
                view_email(email)
            });
      })
    // Change background color of email if it has been read already
    emailDiv.style.backgroundColor = "white";
    if (email.read) {
      emailDiv.style.backgroundColor = "rgb(241, 241, 241, 0.5)";
    }
      document.querySelector("#emails-view").append(emailDiv)
    })
  });
}

function send() {
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  load_mailbox('sent');
  return false
}

function view_email(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'block';

  let subject = document.createElement("div");
  subject.innerHTML = email.subject;
  subject.className = 'email-subject';

  let info = document.createElement("div");
  info.innerHTML = `
      <div>
          <span class="text-muted">From: </span>${email.sender}
          <span class="text-muted" style="float: right; font-size: 13px">${email.timestamp}<i class="far fa-star" style="margin-left: 16px"></i></span>
      </div>
      <div>
          <span class="text-muted">To: </span>${email.recipients.join()}
      </div>
      `;
  info.className = 'email-info';

  let body = document.createElement("div");
  body.innerHTML = email.body;
  body.className = 'email-body';

  let reply_btn = document.createElement("button");
  reply_btn.innerHTML = "Reply";
  reply_btn.className = 'reply-btn';
  reply_btn.addEventListener('click', () => reply_email(email));

  document.querySelector('#email-content').innerHTML = "";
  document.querySelector('#email-content').append(subject)
  document.querySelector('#email-content').append(info)
  document.querySelector('#email-content').append(body)
  document.querySelector('#email-content').append(reply_btn)

  return false;

}

