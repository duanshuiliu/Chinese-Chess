'use strict';

;(function($, window, document, undefined){
    // 定义Beautifier的构造函数
    var Beautifier = function(ele, opt) {
        this.$element = ele,
        this.defaults = {
            limitStepTime: 30,
            chessRow: 10,
            chessCol: 9,
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
            gameData.state  = 'init';
            gameData.loser  = null; 
            gameData.winner = null;

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

                _this.promptMsg('开始游戏');
            });

            // 悔棋
            $("#chess-regret").off();
            $("#chess-regret").on("click", function() {
                let length = chessData.move.length;

                if(length >= 1) {
                    let moveData = chessData.move[length-1];

                    let startPosition = moveData.start;
                    let endPosition   = moveData.end;
                    
                    let $startCell = $table.find("tr:eq("+startPosition[0]+") td:eq("+startPosition[1]+") .cell-piece");
                    let $endCell   = $table.find("tr:eq("+endPosition[0]+") td:eq("+endPosition[1]+") .cell-piece");

                    $startCell.children().remove();
                    $startCell.append(moveData.pieces.start);

                    $endCell.children().remove();
                    $endCell.append(moveData.pieces.end);

                    $table.find(".chess-move").removeClass("chess-move");

                    chessData.state = 'start';
                    chessData.play  = moveData.play;
                    chessData.move.pop();
                }
            });

            // 走棋
            $element.off();
            $element.on('click', function(e) {
                let $target = $(e.target);

                // 是否开始
                if(gameData.state != 'start') {
                    _this.promptMsg('棋局尚未开始');
                    return false;
                }

                // 判断走棋方
                if($target.hasClass('chess-piece') && chessData.state == 'start') {
                    let camp = $target.attr('data-camp');
                    // console.log(camp, chessData);

                    switch(chessData.play) {
                        case 'red':
                            if(camp != 1) {
                                _this.promptMsg('红方执手');
                                return false;
                            }
                            break;
                        case 'black':
                            if(camp != 2) {
                                _this.promptMsg('黑方执手');
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
                            let col       = $parentTd.index();
                            let row       = $parentTr.index();
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
                                    let col       = $parentTd.index();
                                    let row       = $parentTr.index();
                                    let camp      = $target.attr('data-camp'); 

                                    tempMoveData.start = [row, col];
                                    tempMoveData.camp  = camp;
                                    return;
                                }
                            }

                            let $parentTd = $target.parents('td');
                            let $parentTr = $target.parents('tr');
                            let col       = $parentTd.index();
                            let row       = $parentTr.index();

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
                                let $startPiece = $table.find("tr:eq("+tempMoveData.start[0]+") td:eq("+tempMoveData.start[1]+") .chess-piece");
                                let $endPiece   = $table.find("tr:eq("+tempMoveData.end[0]+") td:eq("+tempMoveData.end[1]+") .chess-piece");

                                if(_this.check(tempMoveData)) {
                                    let temp = tempMoveData;

                                    let pieces = {};
                                    pieces.start = null;
                                    pieces.end   = null;

                                    if($startPiece.length >= 1) pieces.start = $startPiece[0];
                                    if($endPiece.length >= 1) pieces.end = $endPiece[0];

                                    temp.pieces = pieces;
                                    temp.play   = chessData.play;
                                    
                                    chessData.move.push(temp);
                                    // console.log(chessData);

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
                                        gameData.loser = newValue;
                                        gameData.state = 'end';
                                    }
                                }, 1000);

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

                        switch(newValue) {
                            case 'end':
                                let msg = '游戏结束';

                                switch(gameData.loser) {
                                    case 'red':
                                        msg = msg+' 黑色方获胜';
                                        break;
                                    case 'black':
                                        msg = msg+' 红色方获胜';
                                        break;
                                }

                                _this.promptMsg(msg, true);

                                break;
                        }
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

            let chessRow = _this.defaults.chessRow;
            let chessCol = _this.defaults.chessCol;

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

            switch (type) {
                case '5':
                    style = style+' chess-king';
                    break;
            }

            html = html+'<div class="chess-piece '+style+'" data-type="'+type+'" data-camp="'+camp+'">'+word+'</div>';

            return html;
        },
        // 棋子属性
        check: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];

            let $startCell  = $table.find("tr:eq("+startRow+") td:eq("+startCol+")");
            let $endCell    = $table.find("tr:eq("+endRow+") td:eq("+endCol+")");
            let $startPiece = $startCell.find(".chess-piece");
            let $endPiece   = $endCell.find('.chess-piece');
            let type        = $startPiece.attr('data-type');
            let camp        = $startPiece.attr('data-camp');

            // 1. 棋子 -- 主观判断
            let allowedCells = _this.chessAttr1(type, camp, startRow, startCol);
            let check1       = _this.isOrNotAttackScope(allowedCells, step.end);
            // console.log(allowedCells, '主观判断');

            if(!check1) {
                // _this.promptMsg('走棋错误');
                return false;
            }

            // 2. 棋子 -- 客观判断（移动该棋子，可能会造成将军的局面）
            let $kings     = $table.find('.chess-king');
            let $kingOwn   = null;
            let $kingEnemy = null;

            $kings.each(function() {
                let kingCamp = $(this).attr('data-camp');

                if(kingCamp == camp) {
                    $kingOwn = $(this);
                }else {
                    $kingEnemy = $(this);
                }
            });

            let $kingOwnParentTr = $kingOwn.parents('tr');
            let $kingOwnParentTd = $kingOwn.parents('td');
            let kingOwnRow       = $kingOwnParentTr.index();
            let kingOwnCol       = $kingOwnParentTd.index();

            let $kingEnemyParentTr = $kingEnemy.parents('tr');
            let $kingEnemyParentTd = $kingEnemy.parents('td');
            let kingEnemyRow       = $kingEnemyParentTr.index();
            let kingEnemyCol       = $kingEnemyParentTd.index();
            // console.log(kingOwnRow, kingOwnCol, kingEnemyRow, kingEnemyCol);

            // 2-1. 被将
            let $cloneS = $startPiece.clone();
            let $cloneE = $endPiece.clone();

            $startCell.find('.cell-piece').children().remove();
            
            $endCell.find('.cell-piece').children().remove();
            $endCell.find('.cell-piece').append($cloneS);

            let beKill = false;
            let kill   = false;

            $table.find('.chess-piece').each(function() {
                let $target    = $(this);
                let targetCamp = $target.attr('data-camp');
                let targetType = $target.attr('data-type');

                if(targetCamp != camp) {
                    let $parentTr = $target.parents('tr');
                    let $parentTd = $target.parents('td');

                    let targetRow = $parentTr.index();
                    let targetCol = $parentTd.index(); 
                    
                    let targetAllowedCells = _this.chessAttr1(targetType, targetCamp, targetRow, targetCol);
                    let targetCheck = _this.isOrNotAttackScope(targetAllowedCells, [kingOwnRow, kingOwnCol]);
                    // console.log(targetRow, targetCol, targetType, targetCamp, targetAllowedCells);

                    if(targetCheck) {
                        beKill = true;
                        return false;
                    }
                }
            });

            $startCell.find('.cell-piece').children().remove();
            $startCell.find('.cell-piece').append($cloneS);

            $endCell.find('.cell-piece').children().remove();
            $endCell.find('.cell-piece').append($cloneE);

            if(beKill) {
                // _this.promptMsg('被将军了');
                return false;
            }

            // 3. 终点是敌方，吃；空，走；友方，禁
            let check2 = this.chessAttr2(step);

            if(check2 !== true) {
                // _this.promptMsg(check2);
                return false;
            }

            // 2-2. 主动将军
            $table.find('.chess-piece').each(function() {
                let $target    = $(this);
                let targetCamp = $target.attr('data-camp');
                let targetType = $target.attr('data-type');   

                if(targetCamp == camp) {
                    let $parentTr = $target.parents('tr');
                    let $parentTd = $target.parents('td');

                    let targetRow = $parentTr.index();
                    let targetCol = $parentTd.index(); 
                    
                    let targetAllowedCells = _this.chessAttr1(targetType, targetCamp, targetRow, targetCol);
                    let targetCheck = _this.isOrNotAttackScope(targetAllowedCells, [kingEnemyRow, kingEnemyCol]);

                    if(targetCheck) {
                        kill = true;
                        return false;
                    }
                }
            });

            if(kill) {
                _this.promptMsg('将军');
                // return false;
            }
 
            return true;
        },
        chessAttr1: function(type, camp, row, col) {
            let allowedCells = [];

            switch(type) {
                // 车
                case '1':
                    allowedCells = this.chessPiece1(camp, row, col);
                    break;
                // 马
                case '2':
                    allowedCells = this.chessPiece2(camp, row, col);
                    break;
                // 象
                case '3':
                    allowedCells = this.chessPiece3(camp, row, col);
                    break;
                // 士
                case '4':
                    allowedCells = this.chessPiece4(camp, row, col);
                    break;
                // 将、帅
                case '5':
                    allowedCells = this.chessPiece5(camp, row, col);
                    break;
                // 炮
                case '6':
                    allowedCells = this.chessPiece6(camp, row, col);
                    break;
                // 卒、兵
                case '7':
                    allowedCells = this.chessPiece7(camp, row, col);
                    break;
            }

            return allowedCells;
        },
        // 终点是敌方，吃；空，走；友方，禁
        chessAttr2: function(step) {
            let _this    = this;
            let $table   = $('.chess');
            let startRow = step.start[0];
            let startCol = step.start[1];
            let endRow   = step.end[0];
            let endCol   = step.end[1];
            
            let $startCell  = $table.find("tr:eq("+startRow+") td:eq("+startCol+") .cell-piece");
            let $endCell    = $table.find("tr:eq("+endRow+") td:eq("+endCol+") .cell-piece");
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
        // 车
        chessPiece1: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;
            // console.log(startRow, startCol, camp, '车');

            let scopeCells = [];

            // 探知活动范围
            // X轴 -- 左
            for(let i = startCol-1; i >= 0; i--) {
                let $movePiece = $table.find("tr:eq("+startRow+") td:eq("+i+") .chess-piece");

                if($movePiece.length >= 1) {
                    let moveCamp = $movePiece.attr('data-camp');

                    if(moveCamp != camp) scopeCells.push([startRow, i]);
                    break;
                    
                }else {
                    scopeCells.push([startRow, i]);
                }
            }

            // X轴 -- 右
            for(let i = startCol+1; i < chessCol; i++) {
                let $movePiece = $table.find("tr:eq("+startRow+") td:eq("+i+") .chess-piece");

                if($movePiece.length >= 1) {
                    let moveCamp = $movePiece.attr('data-camp');

                    if(moveCamp != camp) scopeCells.push([startRow, i]);
                    break;
                    
                }else {
                    scopeCells.push([startRow, i]);
                }
            }

            // Y轴 -- 上
            for(let i = startRow-1; i >= 0; i--) {
                let $movePiece = $table.find("tr:eq("+i+") td:eq("+startCol+") .chess-piece");

                if($movePiece.length >= 1) {
                    let moveCamp = $movePiece.attr('data-camp');

                    if(moveCamp != camp) scopeCells.push([i, startCol]);
                    break;
                    
                }else {
                    scopeCells.push([i, startCol]);
                }
            }

            // Y轴 -- 下
            for(let i = startRow+1; i < chessRow; i++) {
                let $movePiece = $table.find("tr:eq("+i+") td:eq("+startCol+") .chess-piece");

                if($movePiece.length >= 1) {
                    let moveCamp = $movePiece.attr('data-camp');

                    if(moveCamp != camp) scopeCells.push([i, startCol]);
                    break;
                    
                }else {
                    scopeCells.push([i, startCol]);
                }
            }

            return scopeCells;
        },
        // 马
        chessPiece2: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            let tempCells = [
                [startRow-1, startCol-2],
                [startRow-1, startCol+2],
                [startRow+1, startCol-2],
                [startRow+1, startCol+2],
                [startRow-2, startCol-1],
                [startRow-2, startCol+1],
                [startRow+2, startCol-1],
                [startRow+2, startCol+1],
            ];

            for(let i in tempCells) {
                let row = tempCells[i][0];
                let col = tempCells[i][1];

                if(row >= 0 && row < chessRow && col >= 0 && col < chessCol) {
                    let $movePiece = $table.find("tr:eq("+row+") td:eq("+col+") .chess-piece");

                    // 落子不能是友方
                    if($movePiece.length >= 1) {
                        let moveCamp = $movePiece.attr('data-camp');

                        if(moveCamp == camp) continue;
                    }

                    // 蹩腿马
                    let diff1 = Math.abs(startRow-row);
                    let diff2 = Math.abs(startCol-col);

                    if(diff1 == 1) {
                        let j = (startCol-col) > 0 ? startCol-1 : startCol+1;
        
                        let $temp = $table.find("tr:eq("+startRow+") td:eq("+j+") .chess-piece");
        
                        if($temp.length <= 0) scopeCells.push([row, col]);
                    }else {
                        let j = (startRow-row) > 0 ? startRow-1 : startRow+1;
        
                        let $temp = $table.find("tr:eq("+j+") td:eq("+startCol+") .chess-piece");
        
                        if($temp.length <= 0) scopeCells.push([row, col]);
                    }
                }
            }

            return scopeCells;  
        },
        // 象
        chessPiece3: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            let tempCells = [
                [startRow-2, startCol-2],
                [startRow-2, startCol+2],
                [startRow+2, startCol-2],
                [startRow+2, startCol+2],
            ];

            for(let i in tempCells) {
                let row = tempCells[i][0];
                let col = tempCells[i][1];

                if(row >= 0 && row < chessRow && col >= 0 && col < chessCol) {
                    // 不过河
                    let $endRow = $table.find("tr:eq("+row+")");
                    let endCamp = $endRow.attr('data-camp');

                    if(endCamp != camp) continue;

                    // 落子不能是友方
                    let $movePiece = $table.find("tr:eq("+row+") td:eq("+col+") .chess-piece");

                    if($movePiece.length >= 1) {
                        let moveCamp = $movePiece.attr('data-camp');

                        if(moveCamp == camp) continue;
                    }

                    // 蹩腿象
                    let m = (startRow-row) > 0 ? startRow-1 : startRow+1;
                    let n = (startCol-col) > 0 ? startCol-1 : startCol+1;

                    let $temp = $table.find("tr:eq("+m+") td:eq("+n+") .chess-piece");

                    if($temp.length <= 0) {
                        // 不过河
                        let $endRow = $table.find("tr:eq("+row+")");
                        let endCamp = $endRow.attr('data-camp');

                        if(endCamp == camp) scopeCells.push([row, col]);
                    }
                }
            }

            return scopeCells;  
        },
        // 士
        chessPiece4: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            let tempCells = [
                [startRow-1, startCol-1],
                [startRow-1, startCol+1],
                [startRow+1, startCol-1],
                [startRow+1, startCol+1],
            ];

            for(let i in tempCells) {
                let row = tempCells[i][0];
                let col = tempCells[i][1];

                if(row >= 0 && row < chessRow && col >= 0 && col < chessCol) {
                    // 不出营
                    let $endCell = $table.find("tr:eq("+row+") td:eq("+col+")");
                    let endCamp  = $endCell.attr('data-site');
                    // console.log($endCell, camp, endCamp);

                    if(endCamp != camp) continue; 

                    // 落子不能是友方
                    let $movePiece = $table.find("tr:eq("+row+") td:eq("+col+") .chess-piece");

                    if($movePiece.length >= 1) {
                        let moveCamp = $movePiece.attr('data-camp');

                        if(moveCamp == camp) continue;
                    }

                    scopeCells.push([row, col]);
                }
            }

            return scopeCells;   
        },
        // 将、帅
        chessPiece5: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            let tempCells = [
                [startRow, startCol-1],
                [startRow, startCol+1],
                [startRow-1, startCol],
                [startRow+1, startCol],
            ];

            for(let i in tempCells) {
                let row = tempCells[i][0];
                let col = tempCells[i][1];

                if(row >= 0 && row < chessRow && col >= 0 && col < chessCol) {
                    // 不出营
                    let $endCell = $table.find("tr:eq("+row+") td:eq("+col+")");
                    let endCamp  = $endCell.attr('data-site');

                    if(endCamp != camp) continue;

                    // 落子不能是友方
                    let $movePiece = $table.find("tr:eq("+row+") td:eq("+col+") .chess-piece");

                    if($movePiece.length >= 1) {
                        let moveCamp = $movePiece.attr('data-camp');

                        if(moveCamp == camp) continue;
                    }

                    // 帅将碰头 -- 主动出子
                    let position = false;

                    for(let m = row-1; m >= 0; m--) {
                        let $tempPiece = $table.find("tr:eq("+m+") td:eq("+col+") .chess-piece");

                        if($tempPiece.length >= 1 && m != startRow) {
                            if($tempPiece.hasClass('chess-king')) position = true;
                            break;
                        }
                    }

                    for(let m = row+1; m < chessRow; m++) {
                        let $tempPiece = $table.find("tr:eq("+m+") td:eq("+col+") .chess-piece");

                        if($tempPiece.length >= 1 && m != startRow) {
                            if($tempPiece.hasClass('chess-king')) position = true;
                            break;
                        }
                    }

                    if(position) continue;

                    scopeCells.push([row, col]);
                }
            }

            // 帅将碰头 -- 被动出子
            for(let m = startRow-1; m >= 0; m--) {
                let $tempPiece = $table.find("tr:eq("+m+") td:eq("+startCol+") .chess-piece");

                if($tempPiece.length >= 1) {
                    if($tempPiece.hasClass('chess-king')) scopeCells.push([m, startCol]);
                    break;
                }
            }

            for(let m = startRow+1; m < chessRow; m++) {
                let $tempPiece = $table.find("tr:eq("+m+") td:eq("+startCol+") .chess-piece");

                if($tempPiece.length >= 1) {
                    if($tempPiece.hasClass('chess-king')) scopeCells.push([m, startCol]);
                    break;
                }
            }

            return scopeCells;
        },
        // 炮
        chessPiece6: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            // X轴 -- 左
            for(let i = startCol-1; i >= 0; i--) {
                let $movePiece = $table.find("tr:eq("+startRow+") td:eq("+i+") .chess-piece");

                if($movePiece.length >= 1) {
                    // 以己方为跳板，跳向后方第一颗敌方棋子
                    for(let j = i-1; j >= 0; j--) {
                        let $movePiece2 = $table.find("tr:eq("+startRow+") td:eq("+j+") .chess-piece");

                        if($movePiece2.length >= 1) {
                            let moveCamp2 = $movePiece2.attr('data-camp');

                            if(moveCamp2 != camp) scopeCells.push([startRow, j]);
                            break;
                        }
                    }
                    break;
                    
                }else {
                    scopeCells.push([startRow, i]);
                }
            }

            // X轴 -- 右
            for(let i = startCol+1; i < chessCol; i++) {
                let $movePiece = $table.find("tr:eq("+startRow+") td:eq("+i+") .chess-piece");

                if($movePiece.length >= 1) {
                    // 以己方为跳板，跳向后方第一颗敌方棋子
                    for(let j = i+1; j < chessCol; j++) {
                        let $movePiece2 = $table.find("tr:eq("+startRow+") td:eq("+j+") .chess-piece");

                        if($movePiece2.length >= 1) {
                            let moveCamp2 = $movePiece2.attr('data-camp');

                            if(moveCamp2 != camp) scopeCells.push([startRow, j]);
                            break;
                        }
                    }
                    break;
                    
                }else {
                    scopeCells.push([startRow, i]);
                }
            }

            // Y轴 -- 上
            for(let i = startRow-1; i >= 0; i--) {
                let $movePiece = $table.find("tr:eq("+i+") td:eq("+startCol+") .chess-piece");

                if($movePiece.length >= 1) {
                    // 已任一棋子为跳板，跳向后方第一颗敌方棋子
                    for(let j = i-1; j >= 0; j--) {
                        let $movePiece2 = $table.find("tr:eq("+j+") td:eq("+startCol+") .chess-piece");

                        if($movePiece2.length >= 1) {
                            let moveCamp2 = $movePiece2.attr('data-camp');

                            if(moveCamp2 != camp) scopeCells.push([j, startCol]);
                            break;
                        }
                    }
                    break;
                    
                }else {
                    scopeCells.push([i, startCol]);
                }
            }

            // Y轴 -- 下
            for(let i = startRow+1; i < chessRow; i++) {
                let $movePiece = $table.find("tr:eq("+i+") td:eq("+startCol+") .chess-piece");

                if($movePiece.length >= 1) {
                    // 已任一棋子为跳板，跳向后方第一颗敌方棋子
                    for(let j = i+1; j < chessRow; j++) {
                        let $movePiece2 = $table.find("tr:eq("+j+") td:eq("+startCol+") .chess-piece");

                        if($movePiece2.length >= 1) {
                            let moveCamp2 = $movePiece2.attr('data-camp');

                            if(moveCamp2 != camp) scopeCells.push([j, startCol]);
                            break;
                        }
                    }
                    break;
                    
                }else {
                    scopeCells.push([i, startCol]);
                }
            }

            return scopeCells;
        },
        // 卒、兵
        chessPiece7: function(camp, startRow, startCol) {
            let _this    = this;
            let $table   = $('.chess');

            let chessRow  = _this.defaults.chessRow;
            let chessCol  = _this.defaults.chessCol;

            let scopeCells = [];

            // 探知活动范围
            let tempCells = [
                [startRow, startCol-1],
                [startRow, startCol+1],
                [startRow-1, startCol],
                [startRow+1, startCol],
            ];
            
            for(let i in tempCells) {
                let row = tempCells[i][0];
                let col = tempCells[i][1];

                if(row >= 0 && row < chessRow && col >= 0 && col < chessCol) {
                    // 过河可以左右摆动
                    let $endRow = $table.find("tr:eq("+row+")");
                    let endCamp = $endRow.attr('data-camp');

                    if(col != startCol && endCamp == camp) continue;

                    // 不能后退
                    let $campLine = $table.find('tr.camp-line');
                    let flag      = true;

                    $campLine.each(function() {
                        let lineCamp = $(this).attr('data-camp');
                        
                        if(lineCamp == camp) {
                            let index = $(this).index();
        
                            let diff1 = Math.abs(index-row);
                            let diff2 = Math.abs(index-startRow);
                            
                            if(diff1 < diff2) flag = false;
                        }
                    });

                    if(!flag) continue;

                    // 落子不能是友方
                    let $movePiece = $table.find("tr:eq("+row+") td:eq("+col+") .chess-piece");

                    if($movePiece.length >= 1) {
                        let moveCamp = $movePiece.attr('data-camp');

                        if(moveCamp == camp) continue;
                    }

                    scopeCells.push([row, col]);
                }
            }

            return scopeCells;
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
        },
        // 是否在攻击范围
        isOrNotAttackScope: function(scope, value) {
            let result   = false;
            let valueRow = value[0];
            let valueCol = value[1];

            for(let i in scope) {
                let row = scope[i][0];
                let col = scope[i][1];

                if(row == valueRow && col == valueCol) {
                    result = true;
                    break;
                }
            }

            return result;
        },
        // // 是否结束游戏
        // isOrNotGameOver: function() {
        //     let _this  = this;
        //     let $table = $(".table");

        //     let $kings     = $table.find('.chess-king');
        //     let $kingRed   = null;
        //     let $kingBlack = null;

        //     $kings.each(function() {
        //         if($(this).hasClass('chess-piece-red')) $kingRed = $(this);
                
        //         if($(this).hasClass('chess-piece-black')) $kingBlack = $(this);
        //     });

        //     if($kings.length < 2) {
        //         let msg = '游戏结束';

        //         if($kingRed) msg = msg+' 红色方获胜';
        //         if($kingBlack) msg = msg+' 黑色放获胜';

        //         _this.promptMsg(msg);
        //     }
        // },
        // 提示语
        promptMsg: function(msg = '', flag = false) {
            let $tip = $("#tip");
            
            $tip.find('.tip-msg').text(msg);
            $tip.show();

            if(!flag) {
                var tipInl = setTimeout(function() {
                    $tip.hide();
                }, 800);
            }
        }
    }
    // 在插件中使用Beautifier对象
    $.fn.myChess = function(options) {
        var beautifier = new Beautifier(this, options);

        return beautifier.chess();
    }
})(jQuery, window, document);