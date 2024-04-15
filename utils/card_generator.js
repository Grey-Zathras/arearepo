
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
  exports.generateCards25 = function (wordList){
    const maxwords=wordList.length;
    const number_list = [];
    const cards = [25];
    for (var i=0; i<maxwords;i++){
      number_list[i]=i;
    }
    var limit=maxwords; 
    for (var i=0; i<25;i++){
      var n=getRandomInt(limit);
      limit--;
      cards[i]=wordList[ number_list[n] ];
      number_list[n]=number_list[limit];
      number_list[limit]=number_list[n];
    }
    return cards;
  }

  exports.generateSpies = function (){
    const number_list = [];
    const spies = [[],[]];
    const cards = [[],[] ];
    // preparations before shuffle
    for (var j=0; j<2;j++){
        for (var i=0; i<25;i++){
        number_list[i]=i;
        cards[j][i]=i;
        }
    }

    var limit=25; 
    //generate(shuffle) the spies shared cards (0-2)
    for (var i=0; i<3;i++){
        var n=getRandomInt(limit);
        limit--;
        for (var j=0; j<2;j++){
            spies[j][i]=cards[j][n];
            cards[j][n] = cards[j][limit];
            cards[j][limit]=spies[j][i];
        }
    }    
    //generate(shuffle) the spies unique cards (3-8)
    for (var j=0; j<2;j++){
        for (var i=3; i<9;i++){
            var n=getRandomInt(limit);
            limit--;
            spies[j][i]=cards[j][n];
            cards[j][n] = cards[j][limit];
            cards[j][limit]=spies[j][i];
            cards[1-j][n] = cards[1-j][limit];
            cards[1-j][limit]=spies[1-j][i];
        }
    }
    //generate(shuffle) the killers (9-11), randomly shared or not
    for (var i=9; i<12;i++){
        limit--;
        for (var j=0; j<2;j++){
            var n=getRandomInt(limit+1);
            spies[j][i]=cards[j][n];
            cards[j][n] = cards[j][limit];
            cards[j][limit]=spies[j][i];
            cards[1-j][n] = cards[1-j][limit];
            cards[1-j][limit]=spies[1-j][i];
        }
    }

    for (var j=0; j<2;j++){
        for (var i=0; i<25;i++){
            cards[j][i]=0;
        }
    }
    for (var j=0; j<2;j++){
        for (var i=0; i<9;i++){
            cards[j][spies[j][i]]=1;
        }
        for (var i=9; i<12;i++){
            cards[j][spies[j][i]]=2;
        }
    }
    console.log(spies[0]);
    console.log(spies[1]);
    return cards;
  }

  