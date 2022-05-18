const socket = io();

function getUser() {
  return 'Imanol Conde';
}

function getFakeMessage() {
  return `Lorem ipsum dolor sit, amet consectetur adipisicing elit
  Accusantium, ea aliquam commodi ipsam sequi pariatur debitis
  fugiat obcaecati odio sint animi, dicta eos iste harum deleniti
  mollitia nostrum repellat distinctio?`;
}

const renderMessage = (text, files) => {

  const chatWindow = document.querySelector('.chat-window');
  let div = document.createElement('div');

  let template = `
    <i id="user-icon" class="icon fa-solid fa-user"></i>
    <span class="name">${getUser()}</span>
    <span class="date">${moment().calendar()}</span>
    <span class="text">${text}</span>`;
    
  template += renderMessageFiles(files);
  div.innerHTML = template;
  div.classList.add('user-message');


  chatWindow.appendChild(div);
  scrollMessages();

}

function isImage(file) {
  return file.mimetype.startsWith('image/');
}

function renderMessageFiles(files) {
  let template = '';
  if (files != null && typeof files != 'undefined') {
    template += '<div class="files">';
    for (let key in Object.keys(files)) {
      let file = files[key];
      console.log(file);

      if(!isImage(file)) {
        template += `
        <div class="file">
          <i class="represent icon fa-solid ${getFileIcon(file)}"></i>
          <div class="info">
            <a href="#" class="name">${file.originalName}</a>
            <span class="size">${filesize(file.size)}</span>
          </div>
          <i class="download icon fa-solid fa-download"></i>
        </div>`;
      } else {
        let point = 'http://localhost:3000/uploads/'
        template += `
          <img class="file" src="${point + file.savedName}"alt="">
        `;
      }
    };
    template += '</div>';
  }
  return template;
}

function playMessageSent() {
  let audio = document.getElementById('message-sent-audio');
  audio.play();
}

function scrollMessages() {
  var l = document.getElementsByClassName("user-message").length;
  document.getElementsByClassName("user-message")[l - 1].scrollIntoView();
}

function refreshAudio(audioSrc) {
  let audio = document.getElementById('message-sent-audio');
  audio.setAttribute('src', audioSrc);
}

function sendFormData(text) {
  var form = $('.chat-form')[0];
  var data = new FormData(form);

  $.ajax({
    type: "POST",
    enctype: 'multipart/form-data',
    url: "/uploads",
    data: data,
    processData: false,
    contentType: false,
    cache: false,
    timeout: 600000,
    success: function (data) {

      console.log("SUCCESS : ", data);
      socket.emit('chat', {text: text, files: data.data});

    },
    error: function (e) {

      console.log("ERROR : ", e);

    }
  });
}

function main() {

  const chat = document.querySelector('.chat-form');
  const Input = document.querySelector('.chat-input');
  const chatWindow = document.querySelector('.chat-window');
  let audio = document.getElementById('message-sent-audio');
  let file = document.getElementById('chat-file');
  let filePrevs = document.getElementsByClassName('file-prevs')[0];

  chat.addEventListener('submit', event => {
    event.preventDefault();
    console.log(file.files, event);
    if (Input.value || file.files.length > 0) {
      sendFormData(Input.value);
      Input.value = '';
      resetFilePrev();
      $('.chat-form')[0].reset();
      playMessageSent();
    }
    return false;
  });


  socket.on('chat', message => {
    console.log('From server: ', message);
    playMessageSent();
    renderMessage(message.text, message.files);
  });

  file.addEventListener('change', (event) => {

    renderFileChange(file);
    Input.focus();

  });
}

$(document).ready(main);