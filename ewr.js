// ewr.js 1.0.0
// http://www.opensource.org/licenses/mit-license.php
// 壹写作 http://www.1xiezuo.com
// Copyright (c) 2014-2019 1xiezuo.com
// Ewr电子书格式解析模块

;(function() {
  'use strict';
  //用于解析的正则表达式
  var regex = {

    //结构解析
    block:/@@(第(\d*)([场|节|聊]) *(.*))/,
    taxonomy:/(第\d*([章|卷|集])) *(.*)/,
    charpter:/## *(.*)\n{2,}/g,

    /**封面 **/
    cover_main: /^名称[:：](.+)\n(编剧|作者)[:：](.+)(\n备注[:：](.+))?/,
    cover_notes: /^([\s\S]+)/,
    keyvalue:/(.+)[:：](.*)/,

    /**梗概**/
    summary:/^(.+)/g,
    shortsummary:/^一句话梗概[:：](.*)/,
    
    /**角色**/
    actor:/^(.+)(?:\n?)(.*)(?:\n?)(头像[:：](.+))?/,
    /**备注**/
    refer: /^(.+)/g,

    //普通段落
    action: /^(.+)/g,
    splitter: /\n{2,}/g,
    splitterBody: /\n{1,}/g,
    
    /**内容解析**/
    centered: /^(?:> *)(.+)(?: *<)(\n.+)*/g,
    emphasis: /(_|\*{1,3}|_\*{1,3}|\*{1,3}_)(.+)(_|\*{1,3}|_\*{1,3}|\*{1,3}_)/g,
    bold_italic_underline: /(_{1}\*{3}(?=.+\*{3}_{1})|\*{3}_{1}(?=.+_{1}\*{3}))(.+?)(\*{3}_{1}|_{1}\*{3})/g,
    bold_underline: /(_{1}\*{2}(?=.+\*{2}_{1})|\*{2}_{1}(?=.+_{1}\*{2}))(.+?)(\*{2}_{1}|_{1}\*{2})/g,
    italic_underline: /(?:_{1}\*{1}(?=.+\*{1}_{1})|\*{1}_{1}(?=.+_{1}\*{1}))(.+?)(\*{1}_{1}|_{1}\*{1})/g,
    bold_italic: /(\*{3}(?=.+\*{3}))(.+?)(\*{3})/g,
    bold: /(\*{2}(?=.+\*{2}))(.+?)(\*{2})/g,
    italic: /(\*{1}(?=.+\*{1}))(.+?)(\*{1})/g,
    underline: /(_{1}(?=.+_{1}))(.+?)(_{1})/g,
    picture:/^插图[:：](.*)$/,
    page_break: /^\={3,}$/,
    line_break: /^ {2}$/,

        
    //剧本相关
    transition: /^(?:.*)((淡入|切至|切回|淡出)[:：])/,
    dialogue: /^(.{0,20})(\^?)?[:：]+(?!\/)(?:\n?)([\s\S]+)/,
    parenthetical: /^([\(（].+[\)）])$/,
    dpicture: /^(\{{2}.+\}{2})$/,
    note: /^(?:\[{2}(?!\[+))(.+)(?:\]{2}(?!\[+))$/,
    note_inline: /(?:\[{2}(?!\[+))([\s\S]+?)(?:\]{2}(?!\[+))/g,
    boneyard: /(^\/\*|^\*\/)$/g,//备注的内容

 
    //辅助
    cleaner: /^\n+|\n+$/,
    standardizer: /\r/g,
    whitespacer: /^\t+|^ {3,}/gm
  };
  //支持的文体
  var getBookType=function(name){
      switch(name){
          case "电子书":
            return "ebook";
            break;
        case "剧本":
            return "script";
            break;
        case "聊小说":
            return "chat";
            break;
         default:
            return "novel";
            break;
      }
  }
  /*
   对内容的初始化处理
   */
  var lexer = function (script) {
    return script.replace(regex.boneyard, '\n$1\n')
                 .replace(regex.standardizer, '')
                 .replace(regex.cleaner, '')
                 .replace(regex.whitespacer, '');
  };

   var S4=function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
   };
    /*
   生成随机数
   */
   var guid=function() {
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };
  
  /**解析封面 **/
  var tokenizeCover = function (script) {
    var src    = script.split(regex.splitter)
      , i      = src.length, line, match 
      , tokens = [];

    while (i--) {
      line = src[i];
      // cover_main
     //console.log('......cover..'+mainregex);
      if (match = line.match(regex.cover_main)) {
        if (match[5])
        {
            tokens.push({ type: 'cover_source', text: match[5]});
        }
        if (match[3])
        {
            tokens.push({ type: 'cover_author', text: match[3]});
        }
        tokens.push({ type: 'cover_name', text: match[1]});
        continue;
      }

      // cover_notes
      if (match = line.match(regex.cover_notes)) {
        var notes=match[0].split('\n');
        if (notes.length)
        {
            tokens.push({ type: 'cover_notes_end', text: ''});
          while(notes.length){
              var note=notes.pop();
             //console.log(JSON.stringify(note));
              var n=note.split(regex.keyvalue);
             // console.log(n[1]);
              switch(n[1])
              {
                  case "时间":
                      tokens.push({ type: 'cover_date', text: note});
                      break;
                  case "文体":
                      tokens.push({ type: 'cover_booktype', text: note});
                      break;
                  case"展示":
                      tokens.push({ type: 'cover_published', text: note});
                      break;
                  case"状态":
                      tokens.push({ type: 'cover_status', text: note});
                      break;
                  case "风格":
                      tokens.push({ type: 'cover_style', text: note});
                      break;
                  case "类别":
                      tokens.push({ type: 'cover_type', text: note});
                      break;
                  case "长度":
                      tokens.push({ type: 'cover_size', text: note});
                      break;
                   case "联系":
                      tokens.push({ type: 'cover_contact', text: note});
                      break;
                  case "版权":
                      tokens.push({ type: 'cover_copyright',text: note});
                      break;
                 case "阅读章显示":
                      tokens.push({ type: 'cover_chapterdisplay',text: note});
                      break;
                 case "阅读节显示":
                      tokens.push({ type: 'cover_partdisplay',text: note});
                      break;
                  default:
                    tokens.push({ type: 'cover_note', text: note});
                      break;
                  }
            }
            
          tokens.push({ type: 'cover_notes_start', text: ''});
        }
      }
    }
    
    return tokens;
  };
  /**展示封面 html**/
  var parseCover = function (script) {
    var tokens = tokenizeCover(script)
      , i      = tokens.length, token, html = [], output;
    html.push('<div class=\"charpter\">');
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'cover_author': html.push('<p class=\"cover-author\">' + token.text + '</p>'); break;
        case 'cover_name': html.push('<p class=\"cover-name\">' + token.text + '</p>'); break;
        case 'cover_source': html.push('<p class=\"cover-source\">' + token.text + '</p>'); break;
        case 'cover_notes_start': html.push('<div class=\"cover-notes\">'); break;
        case 'cover_notes_end': html.push('</div>'); break;
        case 'cover_type': html.push('<div class=\"cover-type\">' + token.text + '</div>'); break;
        case 'cover_booktype': html.push('<div class=\"cover-booktype\">' + token.text + '</div>'); break;        
        case 'cover_status': html.push('<div class=\"cover-status\">' + token.text + '</div>'); break;
        case 'cover_style': html.push('<div class=\"cover-style\">' + token.text + '</div>'); break;
        case 'cover_published': html.push('<div class=\"cover-date\">' + token.text + '</div>'); break;
        case 'cover_date': html.push('<div class=\"cover-date\">' + token.text + '</div>'); break;
        case 'cover_contact': html.push('<div class=\"cover-contact\">' + token.text + '</div>'); break;
        case 'cover_size': html.push('<div class=\"cover-size\">' + token.text + '</div>'); break;
        case 'cover_copyright': html.push('<div class=\"cover-copyright\">' + token.text + '</div>'); break;
        //case 'cover_chapterdisplay': html.push('<div class=\"cover-chapterdisplay\">' + token.text + '</div>'); break;
       // case 'cover_partdisplay': html.push('<div class=\"cover-partdisplay\">' + token.text + '</div>'); break;
        case 'cover_note': html.push('<div class=\"cover-note\">' + token.text + '</div>'); break;
      }
    }
    html.push('</div>');
    output = html.join('');
    return output;
  };

  /**解析梗概 **/
  var tokenizeSummary = function (script) {
    var src    = script.split(regex.splitterBody)
      , i      = src.length, line, match 
      , tokens = [],summary=[];

    while (i--) {
      line = src[i];
      // centered
      if (match = line.match(regex.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }
      // shortsummary
      if (match = line.match(new RegExp("^"+"一句话梗概"+"[:：](.*)"))) {
        tokens.push({ type: 'shortsummary', text: match[1]});
        continue;
      }
      summary.unshift(line);
      /**
      // summary
      if (match = line.match(regex.summary)) {
        tokens.push({ type: 'summary', text: match[0]});
        continue;
      }
      // line breaks
      if (regex.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
      }**/
    }
    tokens.unshift({ type: 'summary', text: summary.join('\n\n') });
    return tokens;
  };
    /**展示梗概  html**/
  var parseSummary = function (script) {
    var tokens = tokenizeSummary(script)
      , i      = tokens.length, token, html = [], output;
    html.push('<div class=\"charpter\">');
    html.push('<p class=\"charpter-title\">'+'梗概'+'</p>');
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'summary': html.push('<p class=\"action\">' + token.text + '</p>'); break;
        case 'shortsummary': html.push('<p class=\"bold action\">' + token.text + '</p>'); break;
      }
    }
    html.push('</div>');
    output = html.join('');
    return output;
  };
    /**解析序 **/
  var tokenizePrimer = function (script) {
    var src    = script.split(regex.splitterBody)
      , i      = src.length, line, match 
      , tokens = [];

    while (i--) {
      line = src[i];
      // centered
      if (match = line.match(regex.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }
      // shortsummary
      if (match = line.match(new RegExp("^"+"标题"+"[:：](.*)"))) {
        tokens.push({ type: 'title', text: match[1]});
        continue;
      }

      // summary
      if (match = line.match(regex.summary)) {
        tokens.push({ type: 'body', text: match[0]});
        continue;
      }
      // line breaks
      if (regex.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
      }
      tokens.push({ type: 'action', text: line });
    }
    return tokens;
  };
    /**展示序 html **/
  var parsePrimer = function (script) {
      
    var tokens = tokenizePrimer(script)
      , i      = tokens.length, token, html = [], output;
    html.push('<div class=\"charpter\">');
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'body': html.push('<p class=\"action\">' + token.text + '</p>'); break;
        case 'title': html.push('<p class=\"charpter-title\">' + token.text + '</p>'); break;
      }
    }
    html.push('</div>');
    output = html.join('');
    //console.log('primer..'+output);
    return output;
  };
    /**解析序为json **/
  var parsePrimerJson = function (script) {
    var tokens = tokenizePrimer(script)
      , i      = tokens.length, token,  output={summary:"",title:""};
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'body': output.summary += token.text?(token.text+"\n\n"):"";break;
        case 'title': output.title= token.text?(token.text):"";break;
      }
    }
    return output;
  };
  /**解析角色 **/
  var tokenizeActor = function (script) {
    var src    = script.split(regex.splitter)
      , i      = src.length, line, match 
      , tokens = [];

    while (i--) {
      line = src[i];
      // centered
      if (match = line.match(regex.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }
      // actor_summary
   //   console.log('line..'+JSON.stringify(line));
      if (match = line.match(regex.actor)) {
       //   console.log('match..'+JSON.stringify(match));
        if (match[2])
        {
            var text=match[2].split(/\|{2,}/g);
            _.each(text.reverse(),function(k){
                tokens.push({ type: 'actor_description', text:k });
            });
        }
        if (match[4])
        {
            tokens.push({ type: 'actor_picture',  text: match[4]});
        } 
        tokens.push({ type: 'actor_summary', text: match[1]});
        continue;
      }
      // line breaks
      if (regex.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
      }
      tokens.push({ type: 'action', text: line });
    }
    return tokens;
  };
    /**展示角色 html **/
  var parseActor = function (script) {
    var tokens = tokenizeActor(script)
      , i      = tokens.length, token, html = [], output;
    html.push('<div class=\"charpter\">');
    html.push('<p class=\"charpter-title\">'+'人物简介'+'</p>');
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'actor_summary': html.push('<p class=\"actor_summary\">' + token.text + '</p>'); break;
        case 'actor_description': html.push('<p class=\"actor_description\">' + token.text + '</p>'); break;
        case 'actor_picture': html.push('<p class=\"actor_picture\"><img src=\"' + token.text + '\" /></p>'); break;
      }
    }
    html.push('</div>');
    output = html.join('');
   //  console.log(output);
    return output;
  };
    /**解析正文 **/
  var tokenizeBody = function (script,booktype) {
     // console.log('booktype..'+booktype);
      if (!booktype){
          booktype="novel";
      }
    var src    = lexer(script).split(booktype=='juben'?regex.splitter:regex.splitterBody)
      , i      = src.length, line, match, parts, text, meta, x, xlen,parts2,dual
      , tokens = [];
    while (i--) {
      line = src[i];
      // scene headings
      var match="";
      //console.log('......line..'+JSON.stringify(line,null,2));
      if (match = line.match(regex.block)) {
        text = match[0];
       //console.log('......match..'+JSON.stringify(match,null,2));
        if (match[3]=='场'){
            tokens.push({ type: 'scene', text: match[1].toUpperCase(), block_number: match[2] || undefined,title: match[4].toUpperCase() || undefined });
        }
        else if (match[2]=='场'){
            tokens.push({ type: 'scene', text: match[1].toUpperCase(), block_number: match[3] || undefined,title: match[4].toUpperCase() || undefined });
        }
        else if (match[3]=='聊'){
            if (match[4]){
                tokens.push({ type: 'timeline', text: match[1].toUpperCase(), block_number: match[2] || undefined,title: match[4].toUpperCase() || undefined });
            }
        }
        else if (match[2]=='聊'){
            if (match[4]){
                tokens.push({ type: 'timeline', text: match[1].toUpperCase(), block_number: match[3] || undefined,title: match[4].toUpperCase() || undefined });
            }
       }
        else {
            tokens.push({ type: 'block', text: match[1], block_number: match[2] || undefined,title: match[4] || undefined });
        }
        continue;
      }
      if (booktype=='chat'){
                      if (match = line.match(regex.dialogue)) {
                     //   console.log(JSON.stringify(match));
                      // we're iterating from the bottom up, so we need to push these backwards
                      tokens.push({ type: 'dialogue_end' });
                      parts = match[3].split(/^[（\(](.+)\|(.+)[）\)]/);
                     // console.log('parts..'+JSON.stringify(parts));
                      if (parts.length==4){
                         tokens.push({ type: 'dialogue', text: parts[3].replace(/\{{2}/g,'<img src=').replace(/\}{2}/g,'>').trim()});
                         tokens.push({ type: 'cpicture', text:parts[1] });
                          tokens.push({ type: 'character', text: match[1].replace(/[:：]/g,'').trim().toUpperCase() });
                          tokens.push({ type: 'dialogue_begin', dual: (parts[2]=="主角" ? 'right' : 'left' )});
                      }
                      else{
                          tokens.push({ type: 'dialogue', text:line });
                      }
                      continue;
                  }
                  else{
                     //  console.log(line);
                       tokens.push({ type: 'action', text: line });
                      continue;
                  }
      }
      else {
          // centered
          if (match = line.match(regex.centered)) {
            tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
            continue;
          }
          // picture
          if (match = line.match(new RegExp("^"+"插图"+"[:：](\\(\(\\S+)\\))?(.*)"))) {
            tokens.push({ type: 'picture', text: match[3],size:(match[2]?match[2]:null)});
            continue;
          }   
          switch(booktype){
              case "script":
              case "juben":
                  // transitions
                  if (match = line.match(regex.transition)) {
                    tokens.push({ type: 'transition', text: match[1] || match[2] });
                    continue;
                  }
                  // dialogue blocks - characters, parentheticals and dialogue
                  //console.log(JSON.stringify('line..'+line));
                  if (match = line.match(regex.dialogue)) {
                      //  console.log(JSON.stringify(match));
                      // we're iterating from the bottom up, so we need to push these backwards
                      if (match[2]) {
                        tokens.push({ type: 'dual_dialogue_end' });
                      }

                      tokens.push({ type: 'dialogue_end' });
                      parts = match[3].split(/([（\(].+[）\)])/).reverse();
                      //console.log('parts..'+JSON.stringify(parts));
                      for (x = 0, xlen = parts.length; x < xlen; x++) {	
                        text = parts[x];
                        if (text.length > 0) {
                          tokens.push({ type: regex.parenthetical.test(text) ? 'parenthetical' : 'dialogue', text: text.replace(/[“”\"\n]/g,"") });
                        }
                      }
                     // console.log('tokens..'+JSON.stringify(tokens));
                      tokens.push({ type: 'character', text: match[1].replace(/[:：]/g,'').trim().toUpperCase() });
                      tokens.push({ type: 'dialogue_begin', dual: match[2] ? 'right' : dual ? 'left' : undefined });
                      if (dual) {
                        tokens.push({ type: 'dual_dialogue_begin' });
                      }
                  
                      dual = match[2] ? true : false;
                      continue;
                  }
                
                    break;
                default:
                    break;
          }
          // notes
          if (match = line.match(regex.note)) {
            tokens.push({ type: 'note', text: match[1]});
            continue;
          }      
      
      

          // page breaks
          if (regex.page_break.test(line)) {
            tokens.push({ type: 'page_break' });
            continue;
          }
      
          // line breaks
          if (regex.line_break.test(line)) {
            tokens.push({ type: 'line_break' });
            continue;
          }
      
          tokens.push({ type: 'action', text: line });
        }
    }
    return tokens;
  };
    /**展示正文 html **/
  var parseBody = function (script,title,withInfo,chapterdisplay,partdisplay,booktype) {
    var tokens = tokenizeBody(script,booktype)
      , i      = tokens.length, token
      , title, title_page = [],title_note=[], html = [], output;
      if (withInfo)
      {
         if (!title){
            html.push('<div class=\"charpter\">');
            html.push('<p class=\"charpter-title\">'+"正文"+'</p>');
            html.push('</div>');
        }
        else{
            var match="";
            if (match = title.match(regex.taxonomy)) {
                html.push('<div class=\"charpter\">');
                if (match[2]=="卷"){
                    switch (booktype){
                        case "script":
                        case "juben":
                        case "chat":
                            html.push('<p class=\"charpter-title'+(match[2]=="卷"?" volume":"")+'\" >' +  (match[3]?match[3]:"")  + '</p>');
                            break;
                        default:
                            html.push('<p class=\"charpter-title'+(match[2]=="卷"?" volume":"")+'\" >'+ title + '</p>'); 
                            break;
                    }
                }
                else{
                    switch(chapterdisplay){
                        case "章号与标题":
                            html.push('<p class=\"charpter-title'+(match[2]=="卷"?" volume":"")+'\" >'+ title + '</p>'); 
                            break;
                        case "章号":
                             html.push('<p class=\"charpter-title'+(match[2]=="卷"?" volume":"")+'\" >'+ (match[1]?match[1]:"") + '</p>'); 
                            break;
                        case "标题":
                            html.push('<p class=\"charpter-title'+(match[2]=="卷"?" volume":"")+'\" >' +  (match[3]?match[3]:"")  + '</p>');
                            break;
                        default:
                            break;
                    }
                }
                html.push('</div>');
            }
        }
    }
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'block': 
            switch(partdisplay){
                case "节号与标题":
                    html.push('<p class=\"block\" ' + (token.block_number ? ' bid=\"' + token.block_number + '\">' : '>')+ token.block_number+" " + (token.title?token.title:"") + '</p>'); 
                    break;
                case "节号":
                    html.push('<p class=\"block\" ' + (token.block_number ? ' bid=\"' + token.block_number + '\">' : '>')+ token.block_number + '</p>'); 
                    break;
                case "标题":
                    html.push('<p class=\"block\" ' + (token.block_number ? ' bid=\"' + token.block_number + '\">' : '>')+ (token.title?token.title:"") + '</p>'); 
                    break;
                default:
                    break;
            }
            break;
        case 'scene': 
            html.push('<p class=\"scene\" ' + (token.block_number ? ' bid=\"' + token.block_number + '\">' : '>')+ (token.title?token.title:"") + ' <span class=\"scenenum\" >'+token.block_number+'</span></p>'); 
            break;
       case 'timeline': 
            html.push('<p class=\"timeline\" ' + (token.block_number ? ' bid=\"' + token.block_number + '\"><span>' : '><span>')+ (token.title?token.title:"") + '</span></p>'); 
            break;
        case 'transition': html.push((token.text.indexOf('淡出')==0||token.text.indexOf('切至')==0)?('<p class=\"transition\">' + token.text + '</p>'):'<p class=\"transition left-aligned\">' + token.text + '</p>'); break;
        case 'dual_dialogue_begin': html.push('<div class=\"dual-dialogue\">'); break;
        case 'dialogue_begin': html.push('<div class=\"dialogue' + (token.dual ? ' ' + token.dual : '') + '\">'); break;
        case 'character': 
            html.push('<p class=\"character\">' + token.text + '</p>'); 
            break;
        case "cpicture":
            html.push('<p class=\"cpicture\"><img src=\"' + token.text + '\" /></p>');
            break;
        case 'parenthetical': html.push('<p class=\"parenthetical\">' + token.text + '</p>'); break;
        case 'dialogue': 
                html.push('<p class=\"dialoguecontent\">' + token.text + '</p>'); 
                break;
        case 'dialogue_end': html.push('</div> '); break;
        case 'dual_dialogue_end': html.push('</div> '); break;
        case 'dpicture': html.push('<p class=\"dialoguecontent\"><img onclick=\"window.open(\'' + (token.text?token.text:"") + '\',\'_blank\');\" src=\"' + (token.text?token.text:"") + '\" /></p>'); break;
        case 'picture': 
            if (token.size){
                if (token.size=="大"){
                    html.push('<p class=\"picture\"><img src=\"' + (token.text?token.text:"") + '\" width=\"440\" height=\"330\" /></p>'); 
                }
                else if (token.size=="小"){
                    html.push('<p class=\"picture\"><img src=\"' + (token.text?token.text:"") + '\"  width=\"440\" height=\"110\"/></p>'); 
                }
                else {
                    html.push('<p class=\"picture\"><img src=\"' + (token.text?token.text:"") + '\" width=\"440\" height=\"220\" /></p>'); 
                }
            }
            else {
                html.push('<p class=\"picture\"><img src=\"' + (token.text?token.text:"") + '\" /></p>'); 
            }
            break;
        case 'synopsis': html.push('<p class=\"synopsis\">' + token.text + '</p>'); break;
        case 'note': html.push('<!-- ' + token.text + '-->'); break;
        case 'action': html.push('<p class=\"action\">' + (token.text?token.text:"") + '</p>'); break;
        case 'centered': html.push('<p class=\"centered\">' + token.text + '</p>'); break;
        case 'page_break': html.push('<hr />'); break;
        case 'line_break': html.push('<br />'); break;
      }
    }
    output = html.join('');
    //console.log('output..'+output);
    return output;
  };
  /**解析备注 **/
  var tokenizeRefer = function (script) {
    var src    = script.split(regex.splitterBody)
      , i      = src.length, line, match 
      , tokens = [],summary=[];

    while (i--) {
      line = src[i];
      // centered
      if (match = line.match(regex.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
      }
      summary.unshift(line);
    }
    tokens.unshift({ type: 'refer', text: summary.join('\n\n') });
    return tokens;
  };
    /**展示备注 html **/
  var parseRefer = function (script) {
    var tokens = tokenizeRefer(script)
      , i      = tokens.length, token, html = [], output;
    html.push('<div class=\"charpter\">');
    html.push('<p class=\"charpter-title\">'+"附注"+'</p>');
    while (i--) {
      token = tokens[i];
      token.text = inline.lexer(token.text);
      switch (token.type) {
        case 'refer': html.push('<p class=\"refer\">' + token.text + '</p>'); break;
      }
    }
    html.push('</div>');
    output = html.join('');
    return output;
  };
  //内容解析
  var inline = {
    note: '<!-- $1 -->',

    line_break: '<br />',

    bold_italic_underline: '<span class=\"bold italic underline\">$2</span>',
    bold_underline: '<span class=\"bold underline\">$2</span>',
    italic_underline: '<span class=\"italic underline\">$2</span>',
    bold_italic: '<span class=\"bold italic\">$2</span>',
    bold: '<span class=\"bold\">$2</span>',
    italic: '<span class=\"italic\">$2</span>',
    underline: '<span class=\"underline\">$2</span>'
  };
  inline.lexer = function (s) {
    if (!s) {
      return;
    }  

    var styles = [ 'underline', 'italic', 'bold', 'bold_italic', 'italic_underline', 'bold_underline', 'bold_italic_underline' ]
           , i = styles.length, style, match;

    s = s.replace(regex.note_inline, inline.note).replace(/\\\*/g, '[star]').replace(/\\_/g, '[underline]').replace(/\n/g, inline.line_break);

   // if (regex.emphasis.test(s)) {                         // this was causing only every other occurence of an emphasis syntax to be parsed
      while (i--) {
        style = styles[i];
        match = regex[style];
   
        if (match.test(s)) {
          s = s.replace(match, inline[style]);
        }
      }
   // }

    return s.replace(/\[star\]/g, '*').replace(/\[underline\]/g, '_').trim();
  };
    var inline2 = {
    note: '<!-- $1 -->',
    line_break: '<br>',
    bold_italic_underline: '<b><i><u>$2</u></i></b>',
    bold_underline: '<b><u>$2</u></b>',
    italic_underline: '<i><u>$2</i></u>',
    bold_italic: '<b><i>$2</i></b>',
    bold: '<b>$2</b>',
    italic: '<i>$2</i>',
    underline: '<u>$2</u>'
  };
  inline2.lexer = function (s) {
    if (!s) {
      return;
    }  

    var styles = [ 'underline', 'italic', 'bold', 'bold_italic', 'italic_underline', 'bold_underline', 'bold_italic_underline' ]
           , i = styles.length, style, match;

    s = s.replace(regex.note_inline, inline2.note).replace(/\\\*/g, '[star]').replace(/\\_/g, '[underline]').replace(/\n/g, inline.line_break);

   // if (regex.emphasis.test(s)) {                         // this was causing only every other occurence of an emphasis syntax to be parsed
      while (i--) {
        style = styles[i];
        match = regex[style];
   
        if (match.test(s)) {
          s = s.replace(match, inline2[style]);
        }
      }
   // }

    return s.replace(/\[star\]/g, '*').replace(/\[underline\]/g, '_').trim();
  }; 
  //定义
  var ewr = function (content,format,callback) {
    return ewr.parse(content,format, callback);
  };
   /**将ewr文件解析为json格式
    **通过json格式与您的本地库匹配
    **/
  ewr.parseToJson=function (content,callback) {
      //console.log(JSON.stringify(script));
      var manageid=null;
      var sectionid=null;
      var book={};
      var actors=[];
      var chapters=[];
      var parts=lexer(content).split(regex.charpter);
      if (parts.length>1)
      {
          while(parts.length)
          {
              var part=parts.shift();
              var sectiontitle=part;
              var match="";
              if (match = sectiontitle.match(regex.taxonomy)) {
                 part=match[2];
              };
              switch(part)
              {
                 case "封面":
                 case "封页":
                      var body=parts.shift();
                      var tokens = tokenizeCover(body);
                      _.each(tokens,function(t){
                          switch(t.type){
                              case "cover_name":
                              book.name=t.text;
                              break;
                              case "cover_author":
                              book.author=t.text;
                              break;
                              case "cover_source":
                              book.source=t.text;
                              break;
                              case "cover_type":
                              book.type=t.text.split(regex.keyvalue)[2];
                              if (book.type.indexOf(" ")>=0){
                                  book.type=book.type.split(" ")[0];
                              }
                              break;
                              case "cover_booktype":
                              var bt=t.text.split(regex.keyvalue)[2];
                              book.booktype=bt;
                              break;
                              case "cover_date":
                              book.updated=t.text.split(regex.keyvalue)[2];
                              break;
                              case "cover_status":
                              book.status=t.text.split(regex.keyvalue)[2];
                              break;
                              case "cover_size":
                              book.size=t.text.split(regex.keyvalue)[2];
                              break;
                              case "cover_style":
                              book.style=t.text.split(regex.keyvalue)[2];
                              break;
                              case "cover_copyright":
                              book.copyright=t.text.split(regex.keyvalue)[2];
                              break;
                              case "cover_chapterdisplay":
                              var name=t.text.split(regex.keyvalue)[2];
                              book.chapterdisplay=name;
                              break;
                              case "cover_partdisplay":
                              var name=t.text.split(regex.keyvalue)[2];
                              book.partdisplay=name;
                              break;
                          }
                      });
                      break;
                case "梗概":
                      var body=parts.shift();
                      var tokens = tokenizeSummary(body);
                     //  console.log("body.."+JSON.stringify(body));
                      _.each(tokens,function(t){
                          if (t.type=='shortsummary'){
                              book.shortsummary=t.text;
                          }
                          else if (t.type=='summary'){
                              book.summary=t.text;
                          }
                      });
                      break;
                case "附注":
                      var body=parts.shift();
                      var tokens = tokenizeRefer(body);
                      _.each(tokens,function(t){
                          if (t.type=='refer'){
                              book.note=t.text;
                          }
                      });
                      break;
                case "序":
                      var body=parts.shift();
                      var output = parsePrimerJson(body);
                      if (output){
                          output.type=part;
                          output.sort=-1000;
                          chapters.push(output);
                      }
                      break;
                case "卷":
                      manageid=guid();
                      var body=parts.shift();
                      var chapter={};
                          chapter.type=part;
                          chapter.body=body;
                          chapter.title=match[3]?match[3]:"";
                          chapter.id=manageid;
                          chapters.push(chapter);
                      break;
                  case "章":
                  case "集":
                      sectionid=guid();
                      var body=parts.shift();
                      var chapter={};
                          chapter.type=part;
                          chapter.body=body;
                          chapter.title=match[3]?match[3]:"";
                          chapter.parentid=manageid;
                          chapter.id=sectionid;
                          chapters.push(chapter);
                      break;
                  case "节":
                  case "场":
                  case "聊":
                      var body=parts.shift();
                      var chapter={};
                          chapter.type=part;
                          switch(book.booktype){
                              case "聊小说":
                                  chapter.body=body.replace(/([\(（].+[\)）])/g,"");
                                  break;
                              default:
                                  chapter.body=body;
                                  break;
                          }
                          
                          if (!sectionid){
                              chapter.parentid=manageid;
                          }
                          else{
                            chapter.parentid=sectionid;
                          }
                          chapter.title=match[3]?match[3]:"";
                          chapters.push(chapter);
                      break;
                case "人物简介":
                      var body=parts.shift();
                      var tokens = tokenizeActor(body);
                      var top=100;
                      var left=50;
                       var actor={};
                      _.each(tokens,function(t){
                         // console.log(t.type+" "+t.text);
                          if (t.type=='actor_description'){
                              actor={};
                              actor.body=t.text.replace(/(\|\|)+/g,"\n\n");
                          }
                          else if (t.type=='actor_picture'){
                              actor.picture=t.text;
                          }
                          else if (t.type=='actor_summary'){
                              var params=t.text.split("  ");
                              actor.y=top;
                              actor.name=params[0];
                              actor.x=left;
                              actor.age=params[1];
                              actor.sex=params[2];
                              actor.role=params[3];
                              actor.character=(params[4]?params[4]:"")+(params[5]?params[5]:"")+(params[6]?params[6]:"");
                              //console.log(JSON.stringify(actor,null,2));
                              actors.push(actor);
                              left+=200;
                          }
                      });
                      //console.log(JSON.stringify(actors,null,2));
                      break;
                default:
                       break;
                      
              }
          }
          
      };
      var obj={};
      obj.book=book;
      obj.actors=actors;
      obj.chapters=chapters;
       
      //console.log(JSON.stringify(spd,null,2));
      if (typeof callback === 'function') 
       {
           return callback(obj);
       }
      return obj;
  };
  /**将ewr文件解析为html格式
    **通过html格式展示给读者
    **/
  ewr.parseToHtml=function (content,callback) {
      if (!content){
          return "";
      }
      var book={};
      var output = "";
      var parts=lexer(content).split(regex.charpter);
          while(parts.length){
              var c=parts.shift();
              //console.log('charpter..'+c);
              if (c){
                  switch(c){
                  case "封面":
                  case "封页":
                          var body=parts.shift();
                          var tokens = tokenizeCover(body);
                          _.each(tokens,function(t){
                              switch(t.type){
                                  case "cover_booktype":
                                  var bt=t.text.split(regex.keyvalue)[2];
                                  book.booktype=getBookType(bt);
                                  break;
                                  case "cover_chapterdisplay":
                                  var name=t.text.split(regex.keyvalue)[2];
                                  book.chapterdisplay=name;
                                  break;
                                  case "cover_partdisplay":
                                  var name=t.text.split(regex.keyvalue)[2];
                                  book.partdisplay=name;
                                  break;
                              }
                          });
                          //console.log(JSON.stringify(book,null,2));
                          output+=parseCover(body);
                         // console.log(output);
                              break;
                         case "梗概":
                              var body=parts.shift();
                              output+=parseSummary(body);
                              break;
                         case "人物简介":
                              var body=parts.shift();
                              output+=parseActor(body);
                              break;
                        case "附注":
                              var body=parts.shift();
                              output+=parseRefer(body);
                              break;
                        case "序":
                              var body=parts.shift();
                              output+=parsePrimer(body);
                              break;
                        case "正文":
                              var body=parts.shift();
                              //console.log('body..'+body);
                              output+=parseBody(body,null,true,book.chapterdisplay,book.partdisplay,book.booktype);
                              break;
                         default:
                              var body=parts.shift();
                              output+=parseBody(body,c,true,book.chapterdisplay,book.partdisplay,book.booktype);
                              break;
                      }
                  }
              }
     
      output = "<div class='book "+book.booktype+"'>"+output;
      output += "</div>";
      //console.log(JSON.stringify(output,null,2));
      if (typeof callback === 'function') {
              return callback(output);
          }
         return output;
  };
  /**解析ewr文件部分内容
    **bootype 文章类型，包括 小说，电子书，聊小说，剧本
    **chapterdisplay 阅读章显示方式
    **partdisplay 阅读节显示方式
    **title 提供标题
    **withInfo 显示标题
    **callback 返回处理
    **/
  ewr.parseStr=function(content,booktype,chapterdisplay,partdisplay,title,withInfo,callback){
      if (!booktype) booktype="novel";
      if (!chapterdisplay) chapterdisplay="call";
      if (!partdisplay) partdisplay="pall";
      var output = "<div class='book "+booktype+"'>";
      output+=parseBody(content,title,withInfo,chapterdisplay,partdisplay,booktype);
      console.log(JSON.stringify(output));
      output += "</div>";
      if (typeof callback === 'function') {
              return callback(output);
          }
         return output;
  }
  /**
    ewr格式解析
    **content 需要解析的内容
    ** format 包含二种类型('json','html'分别代表json格式及html格式）
    ** callback 完成后执行函数
  **/
  ewr.parse=function (content,format,callback) {
      if (!content) return "";
      if (format=='json') {
          //解析为json
          ewr.parseToJson(content,function(output){
              if (typeof callback === 'function') {
                  return callback(output);
              }
             return output;
          });
      }
      else if (format=='html') {
          //解析为html
          ewr.parseToHtml(content,function(output){
              if (typeof callback === 'function') {
                  return callback(output);
              }
             return output;
          });
      }
      else {
          //解析为其它
          ewr.parseStr(content,"novel","call","pall",null,false,function(output){
              if (typeof callback === 'function') {
                  return callback(output);
              }
             return output;
          });
      }
  };
  if (typeof module !== 'undefined') {
    module.exports = ewr;
  } else {
    this.ewr = ewr;
  }  
}).call(this);

