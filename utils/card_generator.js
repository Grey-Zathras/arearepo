
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
  exports.generateCards25 = function (wordList){
    const maxwords=wordList.length;
    const number_list = [];
    const cards = [25];
    for (let i=0; i<maxwords;i++){
      number_list[i]=i;
    }
    let limit=maxwords; 
    for (let i=0; i<25;i++){
      let n=getRandomInt(limit);
      limit--;
      cards[i]=wordList[ number_list[n] ];
      number_list[n]=number_list[limit];
      number_list[limit]=number_list[n];
    }
    return cards;
  }

  exports.generateSpies = function (){
    //const number_list = [];
    const spies = [[],[]];
    const maybe_killers = [[],[]];
    const cards = [[],[] ];
    // preparations before shuffle
    for (let j=0; j<2;j++){
        for (let i=0; i<25;i++){
        //number_list[i]=i;
        cards[j][i]=i;
        }
    }

    let limit=25; 
    //generate(shuffle) the spies shared cards (0-2)
    for (let i=0; i<3;i++){
        let n=getRandomInt(limit);
        limit--;
        for (let j=0; j<2;j++){
            spies[j][i]=cards[j][n];
            cards[j][n] = cards[j][limit];
            cards[j][limit]=spies[j][i];
        }
    } 
    // killers not shared with spies   
    let mk_limit=limit;// 16; // 25 -9
    for (let j=0; j<2;j++){
        for (let i=0; i< mk_limit;i++){
            maybe_killers[j][i]=cards[j][i];
        }
    }
    //generate(shuffle) the spies unique cards (3-8)
    for (let i=3; i<9;i++){
        mk_limit--;
        for (let j=0; j<2;j++){
            let n=getRandomInt(limit);
            limit--;
            spies[j][i]=cards[j][n];
            cards[j][n] = cards[j][limit];
            maybe_killers[j][n]=cards[j][limit];
            cards[j][limit]=spies[j][i];
            cards[1-j][n] = cards[1-j][limit];
            cards[1-j][limit]=spies[j][i];
        }
    }
    //generate(shuffle) the killers (9-11), randomly shared or not
    for (let i=9; i<12;i++){
        mk_limit--;
        for (let j=0; j<2;j++){
            let n=getRandomInt(mk_limit+1);
            spies[j][i]=maybe_killers[j][n];
            maybe_killers[j][n] = maybe_killers[j][mk_limit];
            maybe_killers[j][mk_limit]=spies[j][i];
        }
    }
    //reuse cards array - nullify
    for (let j=0; j<2;j++){
        for (let i=0; i<25;i++){
            cards[j][i]=0;
        }
    }
    for (let j=0; j<2;j++){
        for (let i=0; i<9;i++){
            cards[j][spies[j][i]]=1;
        }
        for (let i=9; i<12;i++){
            cards[j][spies[j][i]]=2;
        }
    }
    /*
    console.log(spies[0]);
    console.log(spies[1]);
    const filteredArray = spies[0].filter(value => spies[1].includes(value));
    console.log(filteredArray);
    console.log(spies[0].sort(function(a, b){return a - b}));
    console.log(spies[1].sort(function(a, b){return a - b}));
    */
    return cards;
  }

  