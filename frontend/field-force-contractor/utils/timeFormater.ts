type TimeFormat = "UTC"|"LOCAL" | "UTC-DATE" | "LOCAL-DATE"
export class TimeFormater{

    static getTimeStamp:any = (UTC:TimeFormat,DT?:string) =>{
        
        const deviceDate = (DT) ?  new Date(DT) : new Date()
        let period = "";
        switch (UTC){
          case "UTC":

            period = (deviceDate.getUTCHours() < 12) ? "AM" : "PM"
            const utcHours = (deviceDate.getUTCHours() > 12 )?(deviceDate.getUTCHours() - 12 ): deviceDate.getUTCHours();
            const utcMinutes = deviceDate.getUTCMinutes().toString().padStart(2,"0");
            const utcSeconds = deviceDate.getUTCSeconds().toString().padStart(2,"0");
            return(`${utcHours}:${utcMinutes}:${utcSeconds} ${period}`)
           // return(`${deviceDate.toISOString()}`)
          
        
          case "LOCAL":

            period = (deviceDate.getHours() < 12)?"AM":"PM"
            const formatHours = (deviceDate.getHours() > 12)? deviceDate.getHours() - 12 : deviceDate.getHours()
            const formatMinutes =  deviceDate.getMinutes().toString().padStart(2,"0")
            const formatSec =  deviceDate.getSeconds().toString().padStart(2,"0")
            return(`${formatHours}:${formatMinutes}:${formatSec} ${period}`)
            
          case "UTC-DATE":
             return(deviceDate.toISOString())

          case "LOCAL-DATE":
           const month = deviceDate.getMonth() + 1
           const day = deviceDate.getDate()
           const year = deviceDate.getFullYear()
           return(`${month} / ${day} / ${year}`)
           
          default:
            return("")

        }
    }
       
    }

    
