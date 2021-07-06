from flask import Flask, render_template, request,make_response,session,redirect,url_for
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, send, join_room, leave_room,rooms
from random import random
from threading import Thread, Event
from secrets import token_hex
from flask_session import Session

app= Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'

app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.String(16),primary_key=True)
    username = db.Column(db.String(20),unique=False,nullable=True)
    room = db.Column(db.String(20),unique=False,nullable=False)
    status = db.Column(db.String(15),unique=False,nullable=False)

    def __repr__(self):
        return f"User('{self.id}','{self.username}','{self.room}','{self.status}')"
    def __init__(self,id,username,room,status):
        self.id = id
        self.username = username
        self.room = room
        self.status= status

socketio = SocketIO(app)


#thread not used
thread = Thread()
thread_stop_event = Event()

#function not used
def randomNumberGenerator():
    """
    Generate a random number every 1 second and emit to a socketio instance (broadcast)
    Ideally to be run in a separate thread?
    """
    #infinite loop of magical random numbers
    print("Making random numbers")
    while not thread_stop_event.isSet():
        number = round(random()*10, 3)
        print(number)
        socketio.emit('newnumber', {'number': number}, namespace='/inRoom')
        socketio.sleep(5)
#function not used
def startCoundown():
    while not thread_stop_event.isSet():
        socketio.emit('startTimer',{'state':True},namespace='/inRoom')
        socketio.sleep(40)
@app.route('/')
def room():
    session['num'] = token_hex(8)
    return render_template('lobby.html')


@app.route('/inRoom')
def sessions():
    return render_template('main.html')

#function not used
@socketio.on('message')
def handleMessage(msg):
    print('Message: ' +msg)
    send(msg,broadcast=True)

@socketio.on('join',namespace='/')
def on_join(data):
    username = data['username']
    room = data['room']
    db.session.add(User(id = session['num'],username = username,room = room,status='Not Ready'))
    db.session.commit()

#adding user to user db, sending message to clients in same room about connect when client connect to /inRoom
@socketio.on('connect', namespace='/inRoom')
def test_connect():
    uid = session.get('num','not set')
    curr_user=db.session.query(User).filter(User.id == uid).first()
    if(curr_user is None):
        print('User is redirected to /',uid,db.session.query(User).all())
        socketio.emit('redirect',{'url':''},room=request.sid,namespace='/inRoom')
        return
    username = curr_user.username
    room = curr_user.room
    device_names = [[device.username,device.status] for device in db.session.query(User).filter(User.room == room).all()]
    join_room(room)
    send(username + ' has entered the room.', to=room)
    socketio.emit('lobbyUpdate',{"list":device_names},to=room,namespace='/inRoom')




    #Start the random number generator thread only if the thread has not been started before.
    #if not thread.is_alive():
    #    print("Starting Thread")
    #    thread = socketio.start_background_task(randomNumberGenerator)
    #    socketio.start_background_task(startCoundown)


#removing user from user db, sending message to clients in same room about disconnect when client disconnect from /inRoom
@socketio.on('disconnect', namespace='/inRoom')
def test_disconnect():
    uid = session.get('num', 'not set')
    curr_user = db.session.query(User).filter(User.id == uid).first()
    if (curr_user is None):
        return
    username = curr_user.username
    room = curr_user.room
    db.session.delete(curr_user)
    db.session.commit()
    send(username + ' has left the room.', to=room)
    device_names = [[device.username,device.status] for device in db.session.query(User).filter(User.room == room).all()]
    socketio.emit('lobbyUpdate', {"list": device_names}, to=room, namespace='/inRoom')
    print('Client disconnected')
@socketio.on('readyUpdate', namespace='/inRoom')
def onUpdate(data):
    uid = session.get('num', 'not set')
    curr_user = db.session.query(User).filter(User.id == uid).first()
    room = curr_user.room
    curr_user.status = data["value"]
    db.session.commit()
    #after updating,update lobby for client
    device_names = [[device.username, device.status] for device in db.session.query(User).filter(User.room == room).all()]
    socketio.emit('lobbyUpdate', {"list": device_names}, to=room, namespace='/inRoom')
#start game when one of the client press start
@socketio.on('startGame',namespace='/inRoom')
def gameStart(data):
    uid = session.get('num', 'not set')
    room = db.session.query(User).filter(User.id == uid).first().room
    statusList = [device.status for device in db.session.query(User).filter(User.room == room).all()]
    #checks if everyone in the room is ready
    if ("NotReady" in statusList):
        print(statusList)
        return

    socketio.emit('startGameConfirm', {}, to=room, namespace='/inRoom')



if __name__ == '__main__':
    db.drop_all()
    db.create_all()
    socketio.run(app)
