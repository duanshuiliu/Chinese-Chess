'use strict';

;(function($, window, document, undefined){
    // 定义Beautifier的构造函数
    var Beautifier = function(ele, opt) {
        this.$element = ele,
        this.defaults = {
            // 
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

            // 2. 赋予棋子特性
            $element.off();

            // 2-1: 赋予移动特性
            $element.find(".chess-piece").each(function() {
                let $target = $(this);
                // this.giveAttrtoChessPiece($target);
            });
            
            // 2-2: 添加移动样式
            let move = {};
            move.state = 'no';
            move.step  = [];

            $element.on('click', function(e) {
                let $target = $(e.target);
                // console.log($target);

                switch(move.state) {
                    case 'no':
                        if($target.hasClass('chess-piece')) {
                            move.state = 'start';
                            $target.addClass('chess-move');
                        }
                        break;
                    case 'start':
                        if($target.hasClass('chess-move')) {
                            $target.removeClass('chess-move');
                            move.state = 'no';
                        }else if($target.hasClass('chess-piece')) {
                            $target.remove();
                            move.state = 'no';
                        }else {
                            // 可能点到边界线
                            if($target.children().hasClass('chess-piece')) {
                                $target.children().remove();
                                move.state = 'no';
                            }else {
                                let $moveChessPiece = $element.find('.chess-move');
                                console.log($moveChessPiece);
                                let $copy           = $moveChessPiece.clone();

                                $moveChessPiece.remove();
                                $copy.removeClass('chess-move');
                                $target.append($copy);
                                move.state = 'no';
                            }
                        }
                        break;
                }
            });
        },
        // 构建棋盘
        createChessboard: function() {
            let _this    = this;
            let $element = $(_this.$element);

            let chessRow = 9;
            let chessCol = 8;

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

            // 2-1: 红色方
            let camp = 1;
            for(let i in chessPieces) {
                for(let j in chessPieces[i].position) {
                    let row   = parseInt(chessPieces[i].position[j][0]);
                    let col   = parseInt(chessPieces[i].position[j][1]);
                    let word  = chessPieces[i].word[camp];

                    let piece = this.templateOfChessPiece(i, word, camp);

                    $table.find('tr:eq('+(row-1)+') td:eq('+(col-1)+') .chess-cell').append(piece);
                }
            }

            // 2-2: 黑色方
            camp = 2;
            for(let i in chessPieces) {
                for(let j in chessPieces[i].position) {
                    let row   = chessRow-chessPieces[i].position[j][0];
                    let col   = chessPieces[i].position[j][1];
                    let word  = chessPieces[i].word[1];
                    
                    if(chessPieces[i].word.hasOwnProperty(camp)) word = chessPieces[i].word[camp];

                    let piece = this.templateOfChessPiece(i, word, camp);

                    $table.find('tr:eq('+(row+1)+') td:eq('+(col-1)+') .chess-cell').append(piece);
                }
            }

            $element.children().remove();
            $element.append($table);
        },
        // 棋盘
        templateOfChessboard: function(chessRow, chessCol) {
            let html = '';
            let row  = '';
            chessCol = chessCol+1;
            chessRow = chessRow+1;

            for(let i = 0; i < chessRow; i++) {
                let col = '<tr>';

                switch(i) {
                    case 4:
                        col = col+'<td colspan="'+(chessCol-1)+'"><div class="chess-cell chess-cell-mid"><span>楚河</span><span>汉界</span></div></td><td><div class="chess-cell"></div></td>';
                        break;
                    default:
                        for(let j = 0; j < chessCol; j++) {
                            col = col+'<td><div class="chess-cell"></td>';
                        }
                        break;
                        
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
        templateOfChessPiece: function(type=1, word='', camp=1) {
            let html  = '';
            let style = 'chess-piece-camp1';

            switch (camp) {
                case 2:
                    style = 'chess-piece-camp2';
                    break;
                default:
                    style = 'chess-piece-camp1';
                    break;
            }

            html = html+'<div class="chess-piece '+style+'" data-type="'+type+'" data-camp="'+camp+'">'+word+'</div>';

            return html;
        },
        // 棋子属性
        giveAttrtoChessPiece: function($target) {
            let type = $target.attr('data-type');

            switch(type) {
                case '1':
                    this.chessPiece1();
                    break;
            }
        },
        // 属性1：车
        chessPiece1: function() {
            // 
        }
    }
    // 在插件中使用Beautifier对象
    $.fn.myChess = function(options) {
        var beautifier = new Beautifier(this, options);

        return beautifier.chess();
    }
})(jQuery, window, document);