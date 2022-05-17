const socket = io();

const getDate = () => {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var hh = today.getHours();
  var mn = today.getMinutes();

  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (hh < 10) {
    hh = '0' + hh;
  }
  if (mn < 10) {
    mn = '0' + mn;
  }

  return dd + '/' + mm + '/' + yyyy + '     ' + hh + ':' + mn;
}

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
    <span class="date">${getDate()}</span>
    <span class="text">${text}</span>`;
    
  template += renderMessageFiles(files);
  div.innerHTML = template;
  div.classList.add('user-message');


  chatWindow.appendChild(div);
  scrollMessages();

}

function renderMessageFiles(files) {
  let template = '';
  if (files != null && typeof files != 'undefined') {
    template += '<div class="files">';
    for (let key in Object.keys(files)) {
      let file = files[key];
      template += `
        <div class="file">
          <i class="represent icon fa-solid fa-file"></i>
          <div class="info">
            <a href="#" class="name">${file.name}</a>
            <span class="size">${file.size}</span>
          </div>
          <i class="download icon fa-solid fa-download"></i>
        </div>`;
    };
    template += '</div>';
  }
  return template;
}

function playMessageSent() {
  let audio = document.getElementById('message-sent-audio');
  audio.play();
}

function refreshAudio(audioSrc) {
  let audio = document.getElementById('message-sent-audio');
  audio.setAttribute('src', audioSrc);
}

function scrollMessages() {
  var l = document.getElementsByClassName("user-message").length;
  document.getElementsByClassName("user-message")[l - 1].scrollIntoView();
}

function renderFile(file) {

  let div = document.createElement('div');
  let filePrevs = document.getElementsByClassName('file-prevs')[0];

  div.innerHTML = `<i class="icon fa-solid fa-file"></i>
    <p class="file-name">
      ${file.name}
    </p>`;
  div.classList.add('file-prev');

  filePrevs.appendChild(div);
}

function changeFormWrap(forFiles) {

  //Si queremos poner archivos habilitamos la previsualización
  if (forFiles) {
    let formWrap = document.getElementsByClassName('form-wrap')[0];
    formWrap.classList.replace('without-files', 'with-files');
    let filePrevs = document.getElementsByClassName('file-prevs')[0];
    filePrevs.style.display = 'flex';
  //Si queremos borrar archivos de la previsualización deshabilitamos 
  } else {
    let formWrap = document.getElementsByClassName('form-wrap')[0];
    formWrap.classList.replace('with-files', 'without-files');
    let filePrevs = document.getElementsByClassName('file-prevs')[0];
    filePrevs.style.display = 'none';
  }

}

function renderFileChange(file) {

  let filePrevs = document.getElementsByClassName('file-prevs')[0];
  let thereAreFilesToRender = file.files.length > 0;
  changeFormWrap(thereAreFilesToRender);
  filePrevs.innerHTML = '';

  if(!thereAreFilesToRender) return;
  
  for (let key in Object.keys(file.files)) {
    renderFile(file.files[key]);
  };
}

function resetFilePrev() {
  changeFormWrap(false);
  let filePrevs = document.getElementsByClassName('file-prevs')[0];
  filePrevs.innerHTML = '';
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