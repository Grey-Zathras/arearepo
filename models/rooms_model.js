'use strict';
const database = require  ('./../db_sqlite.js');
const {isEmpty} = require  ('./../utils/glbl_objcts.js');
const room_field_list = [
  'title',
  'code' ,
  'lang' , 
  'priv' ,
  'stat' ,
  'cards' ,
  'states',
  'created_at'
];


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

/*
  try {
    await codenames_DB.query('BEGIN');
    if (cards) {
      const queryText = 'UPDATE rooms SET states=$2, cards=$3 WHERE code = $1';
      var { rows } = await codenames_DB.query(queryText, [the_room_id,states,cards]);
    } else {
      const queryText = 'UPDATE rooms SET states=$2 WHERE code = $1';
      var { rows } = await codenames_DB.query(queryText, [the_room_id,states]);
    }
    
    await codenames_DB.query('COMMIT');
  } catch (e) {
    await codenames_DB.query('ROLLBACK');
    throw e;
  } finally {
    //codenames_DB.release()
  }
  //  */
const updateRoom = async function(params, code){
  const keys = Object.keys(params).filter( (key) => {
    return room_field_list.includes(key) && !isEmpty(params[key]);
  });
  if (keys.length > 0){
    if (params.states){
      params.states=JSON.stringify(params.states);
    }
    if (params.cards){
      params.cards=JSON.stringify(params.cards);
    }
    const values = keys.map(key => params[key] );
    const SQLStr="UPDATE rooms SET " + keys.join(' = ?, ') + '=?  WHERE code = ? RETURNING *'; 
    const updateRoomQuery = database.prepare(SQLStr);
    const result = await updateRoomQuery.run(values,code);
  }
  const link_record = await getRoomByCodeQuery.get(code );
  return link_record;
}

/*
const { rows } =  codenames_DB.query(
  'DELETE FROM rooms WHERE code = $1 RETURNING *',
  [the_room.id]
); //no await
// */

const DeleteRoomQuery =  database.prepare(`
  DELETE FROM rooms WHERE code = ?
`);

const deleteRoom = async function (code ) {
  const room_record = await DeleteRoomQuery.run(code );
  return room_record;
}

module.exports = {
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomList,
    getRoomByCode
  };