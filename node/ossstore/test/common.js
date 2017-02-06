var $ = require('node-httpclient');
var fs = require('fs')

var endpoint = 'http://www.annuoyun.com';

module.exports = {
  login: login,
  logout: logout,
  create: create,
  getStsToken: getStsToken,
  completeFile: completeFile
};


function login(username, password) {
  return $.ajax({method:'POST',url:endpoint + '/api/auth/signin', data:{username: username, password: password}, headers:{'content-type':'application/json'}});
}

function logout(token) {
  return $.ajax({method: 'GET', url: endpoint + '/api/auth/signout', headers: {'x-token': token}});
}

function create(token, project, path, size) {
  var data = {
    is_directory: false,
    project_id: project.project_id,
    virtualDirectory: '/' + project.project_name + path,
    description: '',
    file_size: size
  };
  console.log(data)
  return $.ajax({
    method: 'POST',
    url: endpoint + '/api/files',
    headers: {
      'content-type':'application/json',
      'x-token': token
    },
    data: data
  })
}


function getStsToken(token, fileId, operate) {

  return $.ajax({
    method: 'GET',
    url: endpoint + '/api/files/' + fileId + '/token?operate='+(operate||'write'),
    headers: {
      'x-token': token
    }
  })
}


function completeFile(token, fileId) {
  return $.ajax({
    method: 'PUT',
    url: endpoint + '/api/files/' + fileId + '/complete',
    headers: {
      'x-token': token
    },
    data: {}
  })
}
