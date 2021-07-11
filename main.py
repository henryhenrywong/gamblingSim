from flask import Flask, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, send, join_room
from random import random
from threading import Thread, Event
from secrets import token_hex
from flask_session import Session

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
db = SQLAlchemy(app)
roomGameStatus = {}


class User(db.Model):
    id = db.Column(db.String(16), primary_key=True)
    username = db.Column(db.String(20), unique=False, nullable=True)
    room = db.Column(db.String(20), unique=False, nullable=False)
    status = db.Column(db.String(15), unique=False, nullable=False)
    money = db.Column(db.Integer, unique=False, nullable=False)

    def __repr__(self):
        return f"User('{self.id}','{self.username}','{self.room}','{self.status}','{self.money}')"

    def __init__(self, id, username, room, status, money):
        self.id = id
        self.username = username
        self.room = room
        self.status = status
        self.money = money


# class Room(db.Model):
#     id = db.Column(db.String(16), primary_key=True)
#     status = db.Column(db.String(15), unique=False, nullable=False)
#
#     def __repr__(self):
#         return f"Room('{self.id}','{self.status}')"
#     def __init__(self,id,status):
#         self.id = id
#         self.status = status


socketio = SocketIO(app)


@app.route('/')
def room():
    session['num'] = token_hex(8)
    return render_template('lobby.html')


@app.route('/inRoom')
def sessions():
    return render_template('main.html')


@socketio.on('message')
def handleMessage(msg):
    print('Message: ' + msg)
    send(msg, broadcast=True)


@socketio.on('join', namespace='/')
def on_join(data):
    username = data['username']
    room = data['room']
    db.session.add(User(id=session['num'], username=username, room=room, status='Not Ready', money=100))
    db.session.commit()


# adding user to user db, sending message to clients in same room about connect when client connect to /inRoom
@socketio.on('connect', namespace='/inRoom')
def test_connect():
    uid = session.get('num', 'not set')
    curr_user = db.session.query(User).filter(User.id == uid).first()
    if (curr_user is None):
        print('User is redirected to /', uid, db.session.query(User).all())
        socketio.emit('redirect', {'url': ''}, room=request.sid, namespace='/inRoom')
        return
    username = curr_user.username
    room = curr_user.room
    device_names = [[device.username, device.status] for device in
                    db.session.query(User).filter(User.room == room).all()]
    join_room(room)
    send(username + ' has entered the room.', to=room)
    socketio.emit('lobbyUpdate', {"list": device_names}, to=room, namespace='/inRoom')
    # if db.session.query(Room).filter(Room.id == uid).first() is not None:
    #     socketio.emit('sessionactive',{},room=request.sid,namespace='/inRoom')

    # Start the random number generator thread only if the thread has not been started before.
    # if not thread.is_alive():
    #    print("Starting Thread")
    #    thread = socketio.start_background_task(randomNumberGenerator)
    #    socketio.start_background_task(startCoundown)


# removing user from user db, sending message to clients in same room about disconnect when client disconnect from /inRoom
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
    device_names = [[device.username, device.status] for device in
                    db.session.query(User).filter(User.room == room).all()]
    socketio.emit('lobbyUpdate', {"list": device_names}, to=room, namespace='/inRoom')
    print('Client disconnected')
    # if db.session.query(User).filter(User.room == room).first() is None:
    #     row = db.session.query(Room).filter(Room.id == room).first()
    #     db.session.delete(row)
    #     db.session.commit()


# send updates to everyone in the room of user ready status
@socketio.on('readyUpdate', namespace='/inRoom')
def onUpdate(data):
    uid = session.get('num', 'not set')
    curr_user = db.session.query(User).filter(User.id == uid).first()
    room = curr_user.room
    curr_user.status = data["value"]
    db.session.commit()
    # after updating,update lobby for client
    device_names = [[device.username, device.status] for device in
                    db.session.query(User).filter(User.room == room).all()]
    socketio.emit('lobbyUpdate', {"list": device_names}, to=room, namespace='/inRoom')


# start game when one of the client press start and everyone else is ready in the room
@socketio.on('startGame', namespace='/inRoom')
def gameStart(data):
    uid = session.get('num', 'not set')
    room = db.session.query(User).filter(User.id == uid).first().room
    statusList = [device.status for device in db.session.query(User).filter(User.room == room).all()]
    device_names = [[device.username, device.money] for device in
                    db.session.query(User).filter(User.room == room).all()]
    lobbymoney = {}
    for elem in device_names:
        lobbymoney[elem[0]] = elem[1]

    # checks if everyone in the room is ready
    if "NotReady" in statusList:
        print(statusList)
        return
    # emit to all users game have started
    socketio.emit('startGameConfirm', {"list": lobbymoney}, to=room, namespace='/inRoom')
    # update room status to active
    db.session.add(Room(id=room, status="active"))
    db.session.commit()


# update everyone in the room of user current money
@socketio.on('userresult', namespace='/inRoom')
def userinput(data):
    uid = session.get('num', 'not set')
    room = db.session.query(User).filter(User.id == uid).first().room
    user = db.session.query(User).filter(User.id == uid).first()
    if user.status != "Started":
        return
    user.money = data["list"][0]
    db.session.commit()
    device_names = [[device.username, device.money] for device in
                    db.session.query(User).filter(User.room == room).all()]
    lobbymoney = {}
    for elem in device_names:
        lobbymoney[elem[0]] = elem[1]
    socketio.emit('updateplayersmoney', {"list": lobbymoney}, to=room, namespace='/inRoom')
    return


# @socketio.on('endgame',namespace='/inRoom')
# def endgame():
#     uid = session.get('num', 'not set')
#     room = db.session.query(User).filter(User.id == uid).first().room
#     row = db.session.query(Room).filter(Room.id == room).first()
#     db.session.delete(row)
#     db.session.commit()

if __name__ == '__main__':
    db.drop_all()
    db.create_all()
    socketio.run(app, host='0.0.0.0', port=5000)
