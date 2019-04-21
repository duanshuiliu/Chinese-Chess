'use strict';

;(function($, window, document, undefined){
    // 定义Beautifier的构造函数
    var Beautifier = function(ele, opt) {
        this.$element = ele,
        this.defaults = {
            limitStepTime: 30,
        },
        this.options = $.extend({}, this.defaults, opt)
    }
    // 定义Beautifier的方法
    Beautifier.prototype = {
        chess: function() {
            let _this    = this;
            let $element = $(_this.$element);

            // 1. 构建棋盘
            this.createChessboard();

            let $clock = $(".clock");
            let $table = $(".chess");

            // 2. 赋予棋子特性
            let chessData = {};
            chessData.play  = 'init';  // 执棋方
            chessData.state = 'init';  // 下棋状态
            chessData.move  = [];      // 移动数据
            chessData.time  = {};      // 时间数据

            let gameData = {};
            gameData.state = 'init';

            // 时间设定
            // let playTotalTime   = 1000;
            let playStepTime    = _this.defaults.limitStepTime;
            let playStepTimeInl = null;

            $clock.find('.time-current .time').text(0);
            $clock.find('.time-total .time').text(_this.transTime(0)).attr('data-time', '0');

            // 临时数据
            let tempMoveData  = {}; 
            
            // 开始
            $("#chess-start").off();
            $("#chess-start").on("click", function() {
                gameData.state  = 'start';
                chessData.state = 'start';
                chessData.play  = 'red';
            });

            // 走棋
            $element.off();
            $element.on('click', function(e) {
                let $target = $(e.target);

                // 是否开始
                if(gameData.state != 'start') {
                    alert('棋局尚未开始');
                    return false;
                }

                // 判断走棋方
                if($target.hasClass('chess-piece') && chessData.state == 'start') {
                    let camp = $target.attr('data-camp');
                    // console.log(camp, chessData);

                    switch(chessData.play) {
                        case 'red':
                            if(camp != 1) {
                                alert('红方执手，请选择己方棋子');
                                return false;
                            }
                            break;
                        case 'black':
                            if(camp != 2) {
                                alert('黑方执手，请选择己方棋子');
                                return false;
                            }
                            break;
                    }
                }

                switch(chessData.state) {
                    case 'start':
                        if($target.hasClass('chess-piece')) {
                            $target.addClass('chess-move');
                            
                            let $parentTd = $target.parents('td');
                            let $parentTr = $target.parents('tr');
                            let col       = $parentTd.index()+1;
                            let row       = $parentTr.index()+1;
                            let camp      = $target.attr('data-camp'); 

                            tempMoveData.start = [row, col];
                            tempMoveData.camp  = camp;

                            chessData.state = 'move-start';
                        }
                        break;
                    case 'move-start':
                        
                        if($target.hasClass('chess-move')) {
                            // 再次点击该棋子，取消走棋(remove，太繁琐)
                            // 什么都不做

                        }else {
                            if($target.hasClass('chess-piece')) {
                                // 点击到友方棋子，换棋子走棋
                                let $movePiece  = $table.find('.chess-move');
                                let $clickPiece = $target;
                                
                                let moveCamp    = $movePiece.attr('data-camp');
                                let clickCamp   = $clickPiece.attr('data-camp');

                                if(moveCamp == clickCamp) {
                                    $movePiece.removeClass('chess-move');
                                    $target.addClass('chess-move');

                                    let $parentTd = $target.parents('td');
                                    let $parentTr = $target.parents('tr');
                                    let col       = $parentTd.index()+1;
                                    let row       = $parentTr.index()+1;
                                    let camp      = $target.attr('data-camp'); 

                                    tempMoveData.start = [row, col];
                                    tempMoveData.camp  = camp;
                                    return;
                                }
                            }

                            let $parentTd = $target.parents('td');
                            let $parentTr = $target.parents('tr');
                            let col       = $parentTd.index()+1;
                            let row       = $parentTr.index()+1;

                            tempMoveData.end = [row, col];
                            chessData.state = 'move-wait';
                        }
                        break;
                }
            });

            // 监听数据变化
            Object.defineProperties(chessData, {
                _state: {
                    writable: true,
                    value: 'init',
                },
                _play: {
                    writable: true,
                    value: 'init',
                },
                state: {
                    get: function() {
                        return this._state; 
                    },
                    set: function(newValue) {
                        this._state = newValue;

                        switch(newValue) {
                            case 'start':
                                // 
                                break;
                            case 'move-wait':
                                // 检查下棋是否合法
                                if(_this.check(tempMoveData)) {
                                    chessData.move.push(tempMoveData);

                                    tempMoveData = {};
                                    this._state = 'move-end';
                                    this._state = 'end';

                                    chessData.state = 'end';
                                    
                                }else {
                                    this._state = 'move-start';
                                }
                                break;
                            case 'end':
                                // 下棋手交换
                                changePlay();
                                break;
                        }
                    },
                },
                play: {
                    get: function() {
                        return this._play; 
                    },
                    set: function(newValue) {
                        this._play = newValue;

                        // 1. 值变化去除移动子样式
                        $table.find('.chess-move').removeClass('chess-move');

                        // 2. 时间记录
                        // 2-1. 确认需要记录的势力
                        let camp = 1;

                        switch(newValue) {
                            case 'red':
                                camp = 1;
                                break;
                            case 'black':
                                camp = 2;
                                break;
                        }

                        // 2-2. 下棋倒计时初始化
                        $clock.find('.time-current .time').text(0);
                        playStepTime = _this.defaults.limitStepTime;

                        // 2-3. 计时
                        $clock.find(".clock-box").each(function() {
                            let $target    = $(this);
                            let targetCamp = $target.attr('data-camp');

                            let $currentTime = $target.find('.time-current .time');
                            let $totalTime   = $target.find('.time-total .time');

                            if(targetCamp == camp) {
                                // 当前下棋方时间处理
                                $currentTime.text(playStepTime);

                                // a. 倒计时
                                if(playStepTimeInl) clearInterval(playStepTimeInl);

                                playStepTimeInl = setInterval(function() {

                                    let currentTime = parseInt($currentTime.text());
                                    let totalTime   = parseInt($totalTime.attr('data-time'));

                                    currentTime--;
                                    totalTime++;

                                    $currentTime.text(currentTime);
                                    $totalTime.text(_this.transTime(totalTime)).attr('data-time', totalTime);

                                    if(currentTime <= 0) {
                                        clearInterval(playStepTimeInl);

                                        // 强制结束
                                        chessData.state = 'end';
                                    }
                                }, 1000);

                                console.log(1);

                                return false;
                            }
                        });
                    }
                }
            });

            Object.defineProperties(gameData, {
                _state: {
                    writable: true,
                    value: 'init',
                },
                state: {
                    get: function() {
                        return this._state; 
                    },
                    set: function(newValue) {
                        this._state = newValue;
                    },
                }
            });

            // 交换下棋手
            function changePlay() {
                $table.find('.chess-move').removeClass('chess-move');

                // 1. 交换下棋手 
                switch(chessData.play) {
                    case 'red':
                        chessData.play = 'black';
                        break;
                    case 'black':
                        chessData.play = 'red';
                        break;
                }

                // 2. 下一次下棋开始
                chessData.state = 'start';
            }
        },
        // 构建棋盘
        createChessboard: function() {
            let _this    = this;
            let $element = $(_this.$element);

            let chessRow = 10;
            let chessCol = 9;

            // 1. 画棋盘
            let table  = this.templateOfChessboard(chessRow, chessCol);
            let $table = $(table);

            // 2. 添加棋子
            let chessPieces = {
                1: {
                    word: {1: '车'},
                    count: 2,
                    position: [
                        [1,1],[1,9]
                    ]
                },
                2: {
                    word: {1: '马'},
                    count: 2,
                    position: [
                        [1,2],[1,8]
                    ]
                },
                3: {
                    word: {1: '象'},
                    count: 2,
                    position: [
                        [1,3],[1,7]
                    ]
                },
                4: {
                    word: {1: '士'},
                    count: 2,
                    position: [
                        [1,4],[1,6]
                    ]
                },
                5: {
                    word: {1: '帅', 2: '将'},
                    count: 1,
                    position: [
                        [1,5]
                    ]
                },
                6: {
                    word: {1: '炮'},
                    count: 2,
                    position: [
                        [3,2],[3,8]
                    ]
                },
                7: {
                    word: {1: '兵', 2: '卒'},
                    count: 5,
                    position: [
                        [4,1],[4,3],[4,5],[4,7],[4,9]
                    ]
                },
            };

            // 红色方先行，随机选边
            let randomIndex = Math.floor(Math.random()*10);

            // 2-1: 红色方
            let camp = 1;
            for(let i in chessPieces) {
                for(let j in chessPieces[i].position) {
                    let row = parseInt(chessPieces[i].position[j][0]);

                    if(randomIndex >= 5) row = chessRow-row+1;

                    let col   = parseInt(chessPieces[i].position[j][1]);
                    let word  = chessPieces[i].word[1];

                    let piece = this.templateOfChessPiece(i, word, camp, 'red');

                    $table.find('tr:eq('+(row-1)+') td:eq('+(col-1)+') .cell-piece').append(piece);
                }
            }

            // 2-2: 黑色方
            camp = 2;
            for(let i in chessPieces) {
                for(let j in chessPieces[i].position) {
                    let row = parseInt(chessPieces[i].position[j][0]);

                    if(randomIndex < 5) row = chessRow-row+1;

                    let col   = parseInt(chessPieces[i].position[j][1]);
                    let word  = chessPieces[i].word[1];
                    
                    if(chessPieces[i].word.hasOwnProperty(2)) word = chessPieces[i].word[2];

                    let piece = this.templateOfChessPiece(i, word, camp, 'black');

                    $table.find('tr:eq('+(row-1)+') td:eq('+(col-1)+') .cell-piece').append(piece);
                }
            }

            // 2-3: 划定双方势力范围
            $table.find('tr').each(function(i) {
                let $tr = $(this);

                if(i < chessRow/2) {
                    if(randomIndex < 5) {
                        $tr.attr('data-camp', 1);
                    }else {
                        $tr.attr('data-camp', 2);
                    }
                }else {
                    if(randomIndex < 5) {
                        $tr.attr('data-camp', 2);
                    }else {
                        $tr.attr('data-camp', 1);
                    }
                }

                if(i == 0) $tr.addClass('camp-line');
                if(i == (chessRow-1)) $tr.addClass('camp-line');
            });

            // 2-4: 划定双方营地范围
            $table.find('td').each(function() {
                let $td   = $(this);
                let $tr   = $td.parent('tr');
                let camp  = $tr.attr('data-camp');
                let tdIex = $td.index();
                let trIex = $tr.index();

                let tdScope = [3,4,5];
                let trScope = [0,1,2];

                if(($.inArray(tdIex, tdScope) != -1) && $.inArray(trIex, trScope) != -1) {
                    $td.attr('data-site', camp);
                }

                trScope = [7,8,9];

                if(($.inArray(tdIex, tdScope) != -1) && $.inArray(trIex, trScope) != -1) {
                    $td.attr('data-site', camp);
                }
            });

            // 2-5： 时间
            let $clock = $(".clock-container");
            let $time1 = $clock.find('.clock-box').eq(0);
            let $time2 = $clock.find('.clock-box').eq(1);

            if(randomIndex < 5) {
                $time1.attr('data-camp', 1);
                $time2.attr('data-camp', 2);
            }else {
                $time1.attr('data-camp', 2);
                $time2.attr('data-camp', 1);
            }

            $element.children().remove();
            $element.append($table);
        },
        // 棋盘
        templateOfChessboard: function(chessRow, chessCol) {
            let html = '';
            let row  = '';

            for(let i = 0; i < chessRow; i++) {
                let col = '';

                switch(i) {
                    case 4:
                        col = col+'<tr class="chess-mid-top">';
                        break;
                    case 5:
                        col = col+'<tr class="chess-mid-bottom">';
                        break;
                    default:
                        col = col+'<tr>';
                        break;
                }

                for(let j = 0; j < chessCol; j++) {
                    col = col+'<td>'+
                        '<div class="chess-cell">'+
                            '<div class="cell-bg">'+
                                '<div class="cell-bg-box"></div>'+
                                '<div class="cell-bg-box"></div>'+
                                '<div class="cell-bg-box"></div>'+
                                '<div class="cell-bg-box"></div>'+
                            '</div>'+
                            '<div class="cell-piece"></div>'+
                        '</div>'+
                    '</td>';
                }

                col = col+'</tr>';
                row = row+col;
            }

            html = html+
            '<table class="chess">'+
                '<thead></thead>'+
                '<tbody>'+row+'</tbody>';
            '</table>';
            
            return html;
        },
        // 棋子
        templateOfChessPiece: function(type=1, word='', camp=1, cssStyle='red') {
            let html  = '';
            let style = 'chess-piece-red';

            switch (cssStyle) {
                case 'red':
                    style = 'chess-piece-red';
                    break;
                case 'black':
                    style = 'chess-piece-black';
                    break;
            }

            html = html+'<div class="chess-piece '+style+'" data-type="'+type+'" data-camp="'+camp+'">'+word+'</div>';

            return html;
        },
        // 棋子属性
        check: function(step) {
            let _this      = this;
            let $table     = $('.chess');
            let startRow   = step.start[0];
            let startCol   = step.start[1];

            let $startCell = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .chess-piece");
            let type       = $startCell.attr('data-type');
            let camp       = $startCell.attr('data-camp');

            // 1. 棋子走棋规则判断
            let response1 = null;

            switch(type) {
                // 车
                case '1':
                    response1 = this.chessPiece1(step);
                    break;
                // 马
                case '2':
                    response1 = this.chessPiece2(step);
                    break;
                // 象
                case '3':
                    response1 = this.chessPiece3(step);
                    break;
                // 士
                case '4':
                    response1 = this.chessPiece4(step);
                    break;
                // 将、帅
                case '5':
                    response1 = this.chessPiece5(step);
                    break;
                // 炮
                case '6':
                    response1 = this.chessPiece6(step);
                    break;
                // 卒、兵
                case '7':
                    response1 = this.chessPiece7(step);
                    break;
            }

            if(response1 !== true) {
                alert(response1);
                return false;
            }

            // 2. 是否将军或被将军
            // 这一版最大的问题是这里，太复杂，不应该以用户将要进行的步骤被动判断，应该半主观去计算要动的这颗棋子的攻击范围，和可活动范围
            // let response2 = this.chessAttr2();

            // if(response2 !== true) {
            //     return false;
            // }

            // 3. 终点是敌方，吃；空，走；友方，禁
            let response3 = this.chessAttr1(step);

            if(response3 !== true) {
                alert(response3);
                return false;
            }
 
            return true;
        },
        // 终点是敌方，吃；空，走；友方，禁
        chessAttr1: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            let $startCell  = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .cell-piece");
            let $endCell    = $table.find("tr:eq("+(endRow-1)+") td:eq("+(endCol-1)+") .cell-piece");
            let $startPiece = $startCell.find('.chess-piece');
            let $endPiece   = $endCell.find('.chess-piece');
            
            if($endPiece.length >= 1) {
                let camp1 = $startPiece.attr('data-camp');
                let camp2 = $endPiece.attr('data-camp');

                if(camp1 == camp2) {
                    return 'Error: 友方';
                }else {
                    let $copy = $startPiece.clone();

                    $endPiece.remove();
                    $startPiece.remove();
                    $endCell.append($copy);
                }
            }else {
                let $copy = $startPiece.clone();

                $startPiece.remove();
                $endCell.append($copy);
            }

            return true;
        },
        // 是否将军，或被将军
        chessAttr2: function(camp) {
            // 
        },
        // 车
        chessPiece1: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 直行
            if((startRow != endRow) && (startCol != endCol)) return 'Error: 直行';

            // 2. 中途不能有其他棋子(不管友方或敌方)
            if(startRow == endRow) {
                if(startCol < endCol) {
                    for(let i = startCol+1; i < endCol; i++) {
                        let $temp = $table.find("tr:eq("+(startRow-1)+") td:eq("+(i-1)+") .chess-piece");
    
                        if($temp.length >= 1) return 'Error: 有棋子1';
                    }
                }else {
                    for(let i = startCol-1; i > endCol; i--) {
                        let $temp = $table.find("tr:eq("+(startRow-1)+") td:eq("+(i-1)+") .chess-piece");
    
                        if($temp.length >= 1) return 'Error: 有棋子2';
                    }
                }
            }else {
                if(startRow < endRow) {
                    for(let i = startRow+1; i < endRow; i++) {
                        let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(startCol-1)+") .chess-piece");
    
                        if($temp.length >= 1) return 'Error: 有棋子3';
                    }
                }else {
                    for(let i = startRow-1; i > endRow; i--) {
                        let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(startCol-1)+") .chess-piece");
    
                        if($temp.length >= 1) return 'Error: 有棋子4';
                    }
                }
            }

            return true;
        },
        // 马
        chessPiece2: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 飞月
            let diff1 = Math.abs(startRow-endRow);
            let diff2 = Math.abs(startCol-endCol);

            if((diff1 != 1 && diff1 != 2) || (diff2 != 1 && diff2 != 2) || (diff1 == diff2)) return 'Error: 飞月';

            // 2. 蹩腿马
            if(diff1 == 1) {
                let i = (startCol-endCol) > 0 ? startCol-1 : startCol+1;

                let $temp = $table.find("tr:eq("+(startRow-1)+") td:eq("+(i-1)+") .chess-piece");

                if($temp.length >= 1) return 'Error: 蹩腿马1';
            }else {
                let i = (startRow-endRow) > 0 ? startRow-1 : startRow+1;
                // console.log(i, startRow, endRow);

                let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(startCol-1)+") .chess-piece");

                if($temp.length >= 1) return 'Error: 蹩腿马2';
            }

            return true;
        },
        // 象
        chessPiece3: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            console.log('象', step);
            
            // 1. 飞田
            let diff1 = Math.abs(startRow-endRow);
            let diff2 = Math.abs(startCol-endCol);

            if((diff1 != 2) || (diff2 != 2)) return 'Error: 飞田';

            // 2. 蹩腿象
            let i = (startRow-endRow) > 0 ? startRow-1 : startRow+1;
            let j = (startCol-endCol) > 0 ? startCol-1 : startCol+1;
            // console.log(i,j);

            let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(j-1)+") .chess-piece");

            if($temp.length >= 1) return 'Error: 蹩腿象';

            // 3. 不过河
            let $startCell = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .chess-piece");
            let $endRow    = $table.find("tr:eq("+(endRow-1)+")");

            let camp      = $startCell.attr('data-camp');
            let campScope = $endRow.attr('data-camp');

            if(campScope != camp) return 'Error: 不过河';

            return true;
        },
        // 士
        chessPiece4: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 斜走
            let diff1 = Math.abs(startRow-endRow);
            let diff2 = Math.abs(startCol-endCol);

            if((diff1 != 1) || (diff2 != 1)) return 'Error: 斜走';

            // 2. 守营
            let $startCell = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .chess-piece");
            let $endCell   = $table.find("tr:eq("+(endRow-1)+") td:eq("+(endCol-1)+")");
            
            let camp      = $startCell.attr('data-camp');
            let siteScope = $endCell.attr('data-site');

            if(siteScope != camp) return 'Error: 不出营';

            return true;
        },
        // 将、帅
        chessPiece5: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 直走
            let diff1 = Math.abs(startRow-endRow);
            let diff2 = Math.abs(startCol-endCol);

            if((diff1 != 1 && diff1 != 0) || (diff2 != 1 && diff2 != 0) || (diff1 == diff2)) return 'Error: 直走';

            // 2. 守营
            let $startCell = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .chess-piece");
            let $endCell = $table.find("tr:eq("+(endRow-1)+") td:eq("+(endCol-1)+")");
            
            let camp      = $startCell.attr('data-camp');
            let siteScope = $endCell.attr('data-site');

            if(siteScope != camp) return 'Error: 不出营';

            return true;
        },
        // 炮
        chessPiece6: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 直行
            if((startRow != endRow) && (startCol != endCol)) return 'Error: 直行';

            // 2. 中途不能有其他棋子（如果有，终点必是敌方，并且中途仅有一个棋子，位友方）
            let haveCells = [];

            if(startRow == endRow) {
                if(startCol < endCol) {

                    for(let i = startCol+1; i <= endCol; i++) {
                        let $temp = $table.find("tr:eq("+(startRow-1)+") td:eq("+(i-1)+") .chess-piece");
    
                        if($temp.length >= 1) haveCells.push($temp);
                    }
                }else {
                    for(let i = startCol-1; i >= endCol; i--) {
                        let $temp = $table.find("tr:eq("+(startRow-1)+") td:eq("+(i-1)+") .chess-piece");
    
                        if($temp.length >= 1) haveCells.push($temp);
                    }
                }
            }else {
                if(startRow < endRow) {
                    for(let i = startRow+1; i <= endRow; i++) {
                        let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(startCol-1)+") .chess-piece");
    
                        if($temp.length >= 1) haveCells.push($temp);
                    }
                }else {
                    for(let i = startRow-1; i >= endRow; i--) {
                        let $temp = $table.find("tr:eq("+(i-1)+") td:eq("+(startCol-1)+") .chess-piece");
    
                        if($temp.length >= 1) haveCells.push($temp);
                    }
                }
            }

            let length = haveCells.length;

            if(length != 0 && length != 2) return 'Error: 有棋子';

            return true;
        },
        // 卒、兵
        chessPiece7: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            // 1. 直走
            let diff1 = Math.abs(startRow-endRow);
            let diff2 = Math.abs(startCol-endCol);

            if((diff1 != 1 && diff1 != 0) || (diff2 != 1 && diff2 != 0) || (diff1 == diff2)) return 'Error: 直走';

            // 2. 只能前进，不能后退
            let $startCell = $table.find("tr:eq("+(startRow-1)+") td:eq("+(startCol-1)+") .chess-piece");
            let camp       = $startCell.attr('data-camp');
            let $campLine  = $table.find('tr.camp-line');

            let flag = true;

            $campLine.each(function() {
                let lineCamp = $(this).attr('data-camp');
                
                if(lineCamp == camp) {
                    let index = $(this).index();

                    let diff1 = Math.abs(index-endRow);
                    let diff2 = Math.abs(index-startRow);
                    
                    if(diff1 < diff2) flag = false;
                }
            });

            if(!flag) return 'Error: 不能后退';

            // 3. 过河才能左右走
            let $startRow = $table.find("tr:eq("+(startRow-1)+")");
            let startCamp = $startRow.attr('data-camp');

            if(diff2 == 1 && startCamp == camp) return 'Error: 过河才能左右走';

            return true;
        },
        // 时间
        transTime: function(diffTime) {
            let hour   = Math.floor(diffTime/3600);
            let minute = Math.floor(diffTime/60)-hour*60;
            let second = diffTime%60;

            hour   = '0'+hour;
            minute = '0'+minute;
            second = '0'+second;

            return hour.slice(-2)+':'+minute.slice(-2)+':'+second.slice(-2);
        }
    }
    // 在插件中使用Beautifier对象
    $.fn.myChess = function(options) {
        var beautifier = new Beautifier(this, options);

        return beautifier.chess();
    }
})(jQuery, window, document);