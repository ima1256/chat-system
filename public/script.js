const socket = io()

const chat = document.querySelector('.chat-form')
const Input = document.querySelector('.chat-input')

chat.addEventListener('submit', event => {
  event.preventDefault();
  if(Input.value) {
    playMessageSent();
    socket.emit('chat', Input.value || getFakeMessage());
    Input.value = '';
  }
  return false;
});

const chatWindow = document.querySelector('.chat-window');

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

const renderMessage = message => {

  let div = document.createElement('div'); 

  div.innerHTML = `<i id="user-icon" class="icon fa-solid fa-user"></i>
  <span class="name">${getUser()}</span>
  <span class="date">${getDate()}</span>
  <span class="text"
    >${message}</span>`;
  div.classList.add('user-message');
  

  chatWindow.appendChild(div);
  scrollMessages();
}

socket.on('chat', message => {
  console.log('From server: ', message);
  playMessageSent();
  renderMessage(message);
});

let audio = document.getElementById('message-sent-audio');

function playMessageSent() {
  
  audio.play();
}

function scrollMessages() {
  var l = document.getElementsByClassName("user-message").length;
  document.getElementsByClassName("user-message")[l-1].scrollIntoView();
}

let file = document.getElementById('chat-file');

file.addEventListener('change', (event) => {
  console.log(file.value, event);
}); 

function refreshAudio(audioSrc) {
  audio.setAttribute('src', audioSrc);
}