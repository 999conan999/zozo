const Binance = require('node-binance-api');
const binance = new Binance().options({'reconnect':true});
var RSI = require('technicalindicators').RSI;
const TelegramBot = require('node-telegram-bot-api');
const token = '2117499364:AAF0rSayZUp4pU3w5z2j0tY5_tCRN6CbnXM';
const chatId=1497494659;
const bot = new TelegramBot(token, {polling: true});
var rsi_set=43;
var so_sanh='<';

var data=[];

//t.me/News_signal_bot

var data_all=[];
////////////////////////////////
// down
// const time="1w"
const time="15m"
////////////////////////////////
main();
// data_set();
async function main(){
  try{
    let symbols=await get_symbols();
    let symbol_flolow='';
    symbols.forEach(e => {
      symbol_flolow+=`${e}; `
    });
    bot.sendMessage(chatId, `Tìm kiếm những thông tin rsi ${so_sanh} ${rsi_set};Của những đồng coin sau : 
  ${symbol_flolow}
  Các lệnh có thể hỗ trợ : checksocket; now; today; Rsi < 43; btc ;`);
    let list_symbol=symbols;
    get_data_socket(list_symbol);
  }catch(e){
    console.log("loi main()")
  }
}
// khoi tao socket lay data
//
async function get_data_socket(list_symbol){

  try{
    binance.futuresChart(list_symbol, time, (symbol, interval, chart) => {
        let array_data=[];
        Object.keys(chart).forEach(function(key) {
          array_data.push(chart[key].close);
        })
        array_data.pop();
        //
        data_all[symbol]={
          list_close:array_data,
        };
        ///
    },500);
    binance.futuresChart(list_symbol,'1d', (symbol, interval, chart) => {
      let array_data=[];
      Object.keys(chart).forEach(function(key) {
        array_data.push(chart[key].close);
      })
      // array_data.pop();
      //
      data[symbol]={
        list_close:array_data,
      };
      ///
    },500);
  }catch(e){
    console.log("Loi get_data_socket()")
  }

}

// Bot telegram here
try{
bot.on('message', (msg) => {

  let tx=msg.text.toUpperCase();
  if(tx=='CHECKSOCKET'){
    if(check_socket_run()==true){
      bot.sendMessage(chatId,'Socket đang chạy!')
    } else{
      bot.sendMessage(chatId,'Có lỗi đang xảy ra và socket đang dừng, chờ tí nhá, tôi sẽ kết nối lại ngay lập tức.');
      main();
    }
  }else if(tx=="N"){
    bot.sendMessage(chatId,`"Tất cả các thông tin RSI ${so_sanh}  ${rsi_set}, sẽ được nhắc nhở nếu được phát hiện!"`);
    check_symbol_ok(true);
  }else if(tx=="T"){
    check_rsi_day();
  }
  else{
    // const chatId = msg.chat.id;
    // console.log(chatId)
    let message_arr=msg.text.toUpperCase().split(" ");
    if(message_arr[0] == "RSI"){
      if(message_arr.length != 3 || message_arr[0] != "RSI"){
        bot.sendMessage(chatId, `Bạn điền không đúng cú pháp rồi:
    "[RSI][cách][ký tự so sánh > or <][cách][số RSI cần so sánh]"`);
      }else{
        let pp_ss="[ERROR]";
        if(message_arr[1]==">") pp_ss="LỚN HƠN";
        if(message_arr[1]=="<") pp_ss="NHỎ HƠN";
        if(pp_ss!="[ERROR]"){
          so_sanh=message_arr[1];
          rsi_set=Number(message_arr[2]);
          bot.sendMessage(chatId, `Ok, tìm kiếm những thông tin rsi ${pp_ss} ${message_arr[2]}; chúng tôi sẽ thông báo!`);
          check_symbol_ok(true);
        }else{
          bot.sendMessage(chatId, `Có gì đó sai sót trong cú pháp của bạn, bạn cần nên xem lại!`);
        }
      }
    }else{
      check_symbol_ok(true,true,msg.text.toUpperCase());
    }
  }
});
}catch(e){
  console.log('loi bot.on(message, (msg) => {')
}



setTimeout(()=>{
    check_symbol_ok(true);
},60000)
setInterval(()=>{
  let d = new Date();
  let minute = d.getMinutes();
  if(minute==1||minute==16||minute==31||minute==46){
    check_symbol_ok(false);
  }
},40000)

// setInterval(()=>{
//     check_day_sieu_bat_thuong();
// },250000)



// function xu ly data
function check_symbol_ok(is_show_no,is_all=false,name_symbol){
  let symbol=name_symbol+'USDT';
  let result_symbols_rsi='';
  let rsi_set_private=rsi_set;
  let so_sanh_private=so_sanh;
  // if(is_all) rsi_set_private=1;
  // if(is_all) so_sanh_private='>';
if(is_all==false){
  Object.keys(data_all).forEach(function(key) {
    let array_close_prices=data_all[key].list_close;
    let rsi=RSI.calculate({values:array_close_prices,period : 100});
    let l= rsi.length-1;
    let show_icon='';
    // tinh toan rsi day de note rang dong do rat tiem nang hien tai
    if(data[key]!=undefined){
      let list_close=data[key].list_close;
      let rsi_d=RSI.calculate({values:list_close,period : 4});
      let k=rsi_d.length-1;
      if(rsi_d[k]<=20||rsi_d[k-1]<=20||rsi_d[k-2]<=20){
        show_icon='🚩';
      }
    }

    if(so_sanh_private==">"){
      if(rsi[l]>rsi_set_private){
        result_symbols_rsi+=(`🔥-----${key.replace("USDT", "/USDT")}-----: RSI = ${rsi[l]} ${show_icon}
`)
      }
    }else if(so_sanh_private=="<"){
      if(rsi[l]<rsi_set_private){
        result_symbols_rsi+=(`🔥-----${key.replace("USDT", "/USDT")}-----: RSI = ${rsi[l]} ${show_icon}
`)
      }
    }
  })
}else{
  if(data_all[symbol]!=undefined){//[todo]
    let array_close_prices=data_all[symbol].list_close;
    let rsi=RSI.calculate({values:array_close_prices,period : 100});
    let l= rsi.length-1; let rs_d='';let u=100;leng_array_close_prices=array_close_prices.length-1;
    while(1){
      if(rsi[l]<=43||u<=0){
        break;
      }else{
        array_close_prices[leng_array_close_prices]=array_close_prices[leng_array_close_prices]*u/100;
        rsi=RSI.calculate({values:array_close_prices,period : 100});
        u--;
      };
    }
    let price_rsi_43=array_close_prices[leng_array_close_prices].toFixed(3);
    // day 
    if(data[symbol]!=undefined){
    let list_close_day=data[symbol].list_close;
    let rsi_d=RSI.calculate({values:list_close_day,period : 4});
    let t=rsi_d.length-1;let j=100; let leng_list_close_D=list_close_day.length-1;
        // test rsi
        while(1){
          if(rsi_d[t]<=18||j<=0){
            break;
          }else{
            list_close_day[leng_list_close_D]=list_close_day[leng_list_close_D]*j/100;
            rsi_d=RSI.calculate({values:list_close_day,period : 4});
            j--;
          };
        }
        //
        let price_rsi_18=list_close_day[leng_list_close_D].toFixed(3);
    rs_d=`🍑 RSI_1d =( ${rsi_d[t-2]} - ${rsi_d[t-1]} - ${rsi_d[t]})
* "price < ${price_rsi_18}" => RSI_1day < 18;`;

    }
    result_symbols_rsi+=(`🍒-----${symbol.replace("USDT", "/USDT")}-----🍒
===============
🍑 RSI_15m = ${rsi[l]}
* "price < ${price_rsi_43}" => RSI_15m < 43;
===============
${rs_d}`)
  }else{
    result_symbols_rsi+=(`Thông tin : "${name_symbol}" không có dữ liệu hoặc không chính xác!`)
  }
}
  if(result_symbols_rsi!=''){
    bot.sendMessage(chatId, result_symbols_rsi);
  }else{
    if(is_show_no==true){
      bot.sendMessage(chatId, `Hiện tại chưa có data nào thỏa điều kiện RSI ${so_sanh} ${rsi_set} `);
    }
  }
}

async function get_symbols(){
  let rs=[];
  let prevDay= await binance.futuresPrices()
    // if(symbol.indexOf(basic_name)>0){
    Object.keys(prevDay).forEach(function(symbol) {
      if(symbol.indexOf('USDT')>0&&symbol.indexOf('_')==-1&&symbol.indexOf('1000XECUSDT')==-1&&symbol.indexOf('1000SHIBUSDT')==-1){
        rs.push(symbol)
      }
    })
  return rs;
}

function check_socket_run(){
  let check_socket_run=binance.futuresSubscriptions();
  let result=false; let i=0;
  Object.keys(check_socket_run).forEach(function(id_key) {
    i++;
  });
  if(i==2) result=true;
  return result;
}

// 
function check_rsi_day(){
// chua get data ngay hom nay
      let ms=`[`;
      Object.keys(data).forEach(function(key) {
        let array_close_prices=data[key].list_close;
        let rsi=RSI.calculate({values:array_close_prices,period : 4});
        let l= rsi.length-1;
        let t= rsi.length-2;
        let z= rsi.length-3;
        if(rsi[l]<=33||rsi[t]<=33||rsi[z]<=33){
          ms+=`
`;
          ms+='"'+key.replace("USDT", " ")+'('+rsi[z]+' - '+rsi[t]+' - '+rsi[l]+')"; ';
        }
      })
      ms+=`
]`;

      let mss=ms==""?"[không có đồng nào tìm năng]":ms;
      bot.sendMessage(chatId,`🔥 Những đồng tìm năng cần theo dõi trong hôm nay là: 
${mss}`);
}
//
