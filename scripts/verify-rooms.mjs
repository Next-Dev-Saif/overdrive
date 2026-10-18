/** Exercise real Socket.IO room membership without production auth, database or browser. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { io as client } from 'socket.io-client';
const require = createRequire(new URL('../server/package.json', import.meta.url));
const { Server } = require('socket.io');
const { installRoomBrowser, validRoomLoadout } = require('./dist/src/rooms.js');
const server = createServer(), io = new Server(server);
const started = [], sockets = [];
io.use((socket, next) => { socket.data.userId = socket.handshake.auth.user; socket.data.username = socket.handshake.auth.user; next(); });
installRoomBrowser(io, entries => started.push(entries), () => [{ id: 'active', name: 'Active battle', mapId: 'wasteland', humans: 3, capacity: 10, status: 'playing' }], () => false);
const once = (socket, event) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${event}`)), 3000);
    socket.once(event, data => { clearTimeout(timer); resolve(data); });
});
const loadout = { mapId: 'wasteland', vehicleId: 'interceptor', weaponId: 'mortar', vehicleColor: '#aabbcc' };
const enter = (socket, roomId, selected = loadout) => socket.timeout(3000).emitWithAck('enterRoom', { roomId, loadout: selected });
try {
    assert.equal(validRoomLoadout(null), false); assert.equal(validRoomLoadout({ ...loadout, weaponId: 'hacked' }), false);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const connect = async user => { const socket = client(`http://127.0.0.1:${server.address().port}`, { auth: { user }, transports: ['websocket'] }); sockets.push(socket); await once(socket, 'connect'); return socket; };
    const host = await connect('host'), friend = await connect('friend');
    let listed = once(friend, 'roomList'); friend.emit('browseRooms', 'wasteland');
    assert.equal((await listed)[0].status, 'playing');
    assert.match((await enter(friend, 'active')).error, /full or has started/);
    let state = once(host, 'roomState'); assert.deepEqual(await enter(host), {}); const room = (await state).room;
    assert.equal(room.humans, 1);
    assert.ok((await enter(friend, room.id, { ...loadout, mapId: 'glacial' })).error);
    state = once(friend, 'roomState'); assert.deepEqual(await enter(friend, room.id), {});
    assert.equal((await state).room.humans, 2);
    assert.ok((await friend.timeout(3000).emitWithAck('startRoom')).error, 'non-host cannot start');
    const duplicate = await connect('friend'); assert.ok((await enter(duplicate, room.id)).error, 'duplicate account rejected');
    for (let i = 0; i < 8; i++) assert.deepEqual(await enter(await connect(`guest${i}`), room.id), {});
    assert.ok((await enter(await connect('overflow'), room.id)).error, 'room capacity enforced');
    assert.deepEqual(await host.timeout(3000).emitWithAck('startRoom'), {});
    assert.equal(started.length, 1); assert.equal(started[0].length, 10);
    assert.equal(started[0][0].userId, 'host'); assert.equal(started[0][1].weaponId, 'mortar');
    assert.ok((await enter(duplicate, room.id)).error, 'started lobby cannot be joined');
    const secondHost = await connect('secondHost'), secondFriend = await connect('secondFriend');
    state = once(secondHost, 'roomState'); await enter(secondHost); const secondRoom = (await state).room;
    state = once(secondFriend, 'roomState'); await enter(secondFriend, secondRoom.id); await state;
    state = once(secondFriend, 'roomState'); secondHost.disconnect();
    const promoted = await state; assert.equal(promoted.isHost, true); assert.equal(promoted.room.humans, 1);
    assert.deepEqual(await secondFriend.timeout(3000).emitWithAck('startRoom'), {}); assert.equal(started[1].length, 1, 'single human launches for bot fill');
    console.log('PASS: real room directory, map validation, create/join, duplicate users, capacity, host launch, stale rooms and host migration on disconnect.');
} finally { sockets.forEach(socket => socket.disconnect()); await new Promise(resolve => io.close(resolve)); }
