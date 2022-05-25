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

const renderMessage = async (text, files) => {

  const chatWindow = document.querySelector('.chat-window');
  let div = document.createElement('div');

  let template = `
    <i id="user-icon" class="icon fa-solid fa-user"></i>
    <span class="name">${getUser()}</span>
    <span class="date">${moment().calendar()}</span>
    <span class="text">${text.toHtmlEntities()}</span>`;

  template += await renderMessageFiles(files);
  div.innerHTML = template;
  div.classList.add('user-message');
  chatWindow.appendChild(div);

  //hljs.highlightAll();

}

/*async function getLastMessages() {
  let theUrl = 'http://localhost:3000/uploads';
  var xmlHttp = new XMLHttpRequest();

  let callback = (xhr) => {
    console.log(xhr);
  }

  xmlHttp.onreadystatechange = function() { 
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          callback(xmlHttp);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous 
  xmlHttp.send({
    server: 'Servidor1'
  });
}*/

async function getFileContent(file) {
  let dat;
  await $.get('http://localhost:3000/uploads/' + file.savedName, function (data) {
    console.log(data);
    dat = data;
  });
  return dat;
}

async function renderMessageFiles(files) {
  let template = '';
  if (files != null && typeof files != 'undefined') {
    template += '<div class="files">';
    for (let key in Object.keys(files)) {
      let file = files[key];
      let point = 'http://localhost:3000/uploads/';

      if (isImage(file)) {

        template += `
          <img class="file" src="${point + file.savedName}" alt="" download="${file.name}">
        `;

      } else if (isCode(file)) {

        //(await getFileContent(file));
        template += `
        <div class="file code">
          <div class="file-visualization">
            <pre>
              <code>
                ${(await getFileContent(file))}
              </code>
            </pre>
          </div>
          <div class="bottom">
            <span class="expand">
              Expand <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </span>
            <div class="info">
              <a href="${point + file.savedName}" class="name" download="${file.name}">${file.name}</a>
              <span class="size">${filesize(file.size)}</span>
            </div>
            <a class="download" href="${point + file.savedName}" download="${file.name}"> 
              <i class="download icon fa-solid fa-download"></i>
            </a>
            </div>
        </div>`;
      } else {
        template += `
            <div class="file">
              <i class="represent icon fa-solid ${getFileIcon(file)}"></i>
              <div class="info">
                <a href="${point + file.savedName}" class="name" download="${file.name}">${file.name}</a>
                <span class="size">${filesize(file.size)}</span>
              </div>
              <a class="download" href="${point + file.savedName}" download="${file.name}"> 
                <i class="download icon fa-solid fa-download"></i>
              </a>
            </div>`;
      };
    }
    template += '</div>';
  }
  return template;
}

function playMessageSent() {
  let audio = document.getElementById('message-sent-audio');
  audio.play();
}

function scrollMessages() {
  //var l = document.getElementsByClassName("user-message").length;
  //var lastMessage = document.getElementsByClassName("user-message")[l - 1];
  $(".chat-window").animate({ scrollTop: $(".chat-window")[0].scrollHeight }, "fast");
  //lastMessage.scrollIntoView();
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
    url: "http://localhost:3000/uploads",
    data: data,
    processData: false,
    contentType: false,
    cache: false,
    timeout: 600000,
    success: function (data) {

      socket.emit('chat', { text: text, files: data.data });

    },
    error: function (e) {

      console.log("ERROR : ", e);

    }
  });
}

function main() {

  //getLastMessages();
  //Para tener una función de strings que nos 
  String.prototype.toHtmlEntities = function () {
    return this.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  };

  const chat = document.querySelector('.chat-form');
  const Input = document.querySelector('.chat-input');
  const chatWindow = document.querySelector('.chat-window');
  let audio = document.getElementById('message-sent-audio');
  let file = document.getElementById('chat-file');
  let filePrevs = document.getElementsByClassName('file-prevs')[0];

  chat.addEventListener('submit', event => {
    event.preventDefault();
    //console.log(file.files, event);
    if (Input.value || file.files.length > 0) {
      sendFormData(Input.value);
      resetFilePrev();
      $('.chat-form')[0].reset();
    }
    return false;
  });


  socket.on('chat', message => {
    console.log('From server: ', message);
    playMessageSent();
    renderMessage(message.text, message.files).then(()=>{
      scrollMessages();
    });
  });

  file.addEventListener('change', (event) => {

    renderFileChange(file);
    Input.focus();

  });
}

$(document).ready(main);