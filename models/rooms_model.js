'use strict';
const database = require  ('./../db_sqlite.js');

const countRooms2 = async function (keys,values) {
    var SQLStr=`SELECT COUNT(ROWID) as count FROM rooms`;
    var res;
    if (keys && keys.length) {
        SQLStr +=  ` WHERE ` + keys.join(' = ? AND ') + `= ?`;
        const query = database.prepare(SQLStr);
        res = await query.get(values);
    } else {
      const query = database.prepare(SQLStr);
      res = await query.get();
    }
    return res.count;
}

const getRooms2 = async function (keys, values,limit, offset) {
    var SQLStr=`SELECT * FROM rooms `;
    var res;
    if (keys && keys.length) {
        SQLStr +=  ` WHERE ` + keys.join(' = ? AND ') + `= ? LIMIT ? OFFSET ?`;
        const query = database.prepare(SQLStr);
        res = await query.all(values, limit, offset);
    } else {
      const query = database.prepare(SQLStr + " LIMIT ? OFFSET ?");
      res = await query.all(limit, offset);
    }
    return res;
}
  


//const { rows } = await codenames_DB.query('SELECT *  FROM rooms where priv=FALSE'); //id, title,code, stat, lang

const getRoomList = async function ({req,paging}, priv = 0 ) {
    
    //const keys = Object.keys(req.query);
    const keys = ["priv"];
    const values =[priv]; 

    const current_page_rec = paging.current_page_rec;
    const count = await countRooms2(keys,values);
    
    const room_list = await getRooms2(keys, values, paging.size, current_page_rec-1 );
    
    room_list.paging_size = paging.size;
    room_list.current_page = Math.ceil((paging.current_page_rec + paging.size-1) / paging.size) ;   //paging.current_page;
    room_list.current_page_rec = paging.current_page_rec ;
    room_list.pages_number = Math.ceil(count / paging.size);   
    room_list.rec_count = count;   
    
    return room_list;
}

const getRoomByCodeQuery = database.prepare(`
    SELECT * FROM rooms WHERE code = ?
  `);

const getRoomByidQuery = database.prepare(`
    SELECT * FROM rooms WHERE id = ?
  `);

//const { rows } = await codenames_DB.query("SELECT * FROM rooms WHERE code = $1", [code]);
const getRoomByCode = async function (code ) {
    const room_record = await getRoomByCodeQuery.get(code );
    if (room_record) {
        const cards = JSON.parse(room_record.cards);
        const states = JSON.parse(room_record.states);
        room_record.cards = cards;
        room_record.states = states;
    }
    return room_record;
}

/*
const { rows } = await codenames_DB.query(
    'INSERT INTO rooms(title, code, cards, states, lang ) VALUES($1, $2, $3, $4, $5) RETURNING *',
    [title, code, cards, states, lang]
  );
// */

const createRoomQuery = database.prepare(`
    INSERT INTO rooms ( title, code, cards, states, lang)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `);
const createRoom = async function({title, code, cards, states, lang}){
    const result = await createRoomQuery.run(title, code, JSON.stringify(cards), JSON.stringify(states), lang);
    const link_record = await getRoomByidQuery.get(result.lastInsertRowid );
    return link_record;
}

module.exports = {
    createRoom,
    getRoomList,
    getRoomByCode
  };