

function isCode(file) {
  //console.log('File: ', file);
  var fileExtension = file.name.split('.').pop(); 
  //console.log(fileExtension);
  return fileExtension == 'js' || fileExtension == 'html' || fileExtension == 'css';
}

function isImage(file) {
  return (file.mimetype || file.type).startsWith('image/');
}

function getFileIcon (file) {

  let template = 'fa-file';

  const fileClass = {
    'application/pdf': 'fa-file-pdf',
    'application/gzip': 'fa-file-zipper',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-word',
    'text/csv': 'fa-file-csv',
  };

  
  if(file.type.startsWith('video/')){
      template = 'fa-file-video';
  } else if(file.type.startsWith('audio/')){
      template = 'fa-file-audio';
  } else if(isCode(file)) {
      template = 'fa-code';
  } else if(Object.keys(fileClass).includes(file.type)){
      template = fileClass[file.type];
  } 

  return template;
}

function renderFile(file) {

    let div = document.createElement('div');
    let filePrevs = document.getElementsByClassName('file-prevs')[0];

  
    //console.log('Archivos: ', file);
    //Posibles tipos de archivos:
    /*  
      PDF
      Comprimido
      Imagenes                                                        
      Archivo de tipo open ofice / presentacion
      Archivo de audio                                                
      Archivo de codigo
      Archivo de csv      .csv
      Archivo generico
    */
  
    let template = '';

    if(file.type.startsWith('image/')) 
      template += `<img class="image-prev" alt="" src="${URL.createObjectURL(file)}"></img>`;
    else template += `<i class="icon fa-solid ${getFileIcon(file)}"></i>`;

  
    template += `
      <p class="file-name">
        ${file.name}
      </p>`;
    
    div.innerHTML = template;
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
