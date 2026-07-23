export const metroStations = ['Aluva','Pulinchodu','Companypady','Ambattukavu','Muttom','Kalamassery','Cochin University','Pathadipalam','Edapally','Changampuzha Park','Palarivattom','JLN Stadium','Kaloor','Town Hall','MG Road',"Maharaja's College",'Ernakulam South','Kadavanthra','Elamkulam','Vyttila','Thaikoodam','Pettah','Vadakkekotta','SN Junction','Thrippunithura Terminal'];
export const waterRoutes = [
  {name:'Vypin ↔ High Court', stops:['Vypin','High Court'], fare:20, time:20},
  {name:'Vyttila ↔ Kakkanad', stops:['Vyttila Mobility Hub','Kakkanad'], fare:20, time:25, key:'vyt'},
  {name:'South Chittoor ↔ High Court', stops:['South Chittoor','High Court'], fare:20, time:15},
  {name:'South Chittoor ↔ Cheranelloor', stops:['South Chittoor','Cheranelloor'], fare:20, time:15},
  {name:'High Court ↔ Fort Kochi', stops:['High Court','Fort Kochi'], fare:20, time:20, key:'fort'},
  {name:'High Court ↔ Willingdon Island ↔ Mattancherry', stops:['High Court','Willingdon Island','Mattancherry'], fare:20, time:25}
];
export const landmarks = { 'Fort Kochi':{type:'water', terminal:'Fort Kochi'}, 'Mattancherry Palace':{type:'water', terminal:'Mattancherry'}, 'Kakkanad':{type:'water', terminal:'Kakkanad'}, 'Infopark':{type:'feeder', station:'JLN Stadium'}, 'Kochi Airport':{type:'feeder', station:'Aluva'}, 'Marine Drive':{type:'water', terminal:'High Court'} };
export const metroFare = stops => stops <= 2 ? 10 : stops <= 5 ? 20 : stops <= 10 ? 30 : stops <= 15 ? 40 : stops <= 20 ? 50 : 60;
