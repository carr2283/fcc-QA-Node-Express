/*global io*/
let socket = io();
$(document).ready(function () {
  // Form submition with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    // send message to server
    socket.emit('chat message', messageToSend);
    // clear form
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
  socket.on('user', data => {
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name + (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });
  
  socket.on('chat message', data => {
    let message = data.name + ": " + data.message;
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  })
});
