            function d_day(day) // This function returns the day's numerical abbrevation (st,nd,rd,th)
            {
                var day_th="";
                switch(day[1])
                {
                    case 1: day_th="st"; break;
                    case 2: day_th="nd"; break;
                    case 3: day_th="rd"; break;
                    default: day_th="th"; break;
                }
                return day+day_th;
            }
            function d_month(mnth) // This receives a month's number and returns it as text
            {
                var m_list=["January","February","March","April","May","June","July","August","September","October","November","December"];
                return m_list[mnth];
            }
            function pDay(d_day) // This function receives a day as a string and returns it as the appropriate integer
            {
                switch(d_day.toLowerCase())
                {
                    case "sunday": return 0; break;
                    case "monday": return 1; break;
                    case "tuesday": return 2; break;
                    case "wednesday": return 3; break;
                    case "thursday": return 4; break;
                    case "friday": return 5; break;
                    case "saturday": return 6; break;
                }
            }
            function diffDays(dt1,dt2) // Calculate the difference between 2 days and return the answer as integer
            {
                var date1=new Date(Date.parse(dt1));
                var date2=new Date(Date.parse(dt2));
                var diff = parseInt((date2 - date1) / (1000 * 60 * 60 * 24));
                return diff;
            }
            function addDays(date, days) // Adds days and returns result as a date object
            {
                var result=new Date(Date.parse(date));
                result.setDate(result.getDate() + days);
                return result;
            }
            function formatDate(date) // This formats the date to specification
            {
                var dt=new Date(Date.parse(date));
                return d_month(dt.getMonth())+", "+dt.getDate()+" "+dt.getFullYear();
            }
            function rSum(n_days,r_sum,p_freq) // This function returns the total rent sum for x amount of days
            {
                return "$"+((r_sum/p_freq)*(n_days+1)).toFixed(2);
            }
            function firstPayPeriod(startDate,pay_day) // The first week of rent
            {
                if (startDate.getDay()!=pDay(pay_day))
                {
                    return addDays(startDate,((pDay(pay_day)>startDate.getDay()) ?pDay(pay_day)-startDate.getDay() :startDate.getDay()-pDay(pay_day)-1));
                }
            }
            function tableData(queryStr, dd) // the core function that processed the JSON data and displays it in the required format
            {
                // Bonus task 1 and 2: Blank input returns list of tenants, whose IDs are clickable to display data on said tenant using the same UI
                if (queryStr==0)
                {
                    var p_output='<table class="pay_output">\n\t';
                    p_output+="<tr>\n\t\t<td>ID</td>\n\t\t<td>Tenant</td>\n\t</tr>";
                    for (var y=0; y<dd.length; y++)
                    {
                        p_output+="<tr>\n\t\t<td><a class='a_id' href='#' onclick='showPayment(this.innerText); return false;'>"+dd[y]["id"]+"</a></td>\n\t\t<td>"+dd[y]["tenant"]+"</td>\n\t</tr>";
                    }
                    p_output+="</table>";
                    return p_output;
                }
                else { // This displays individual payment data based on the lease ID being queried
                    var payFreq=0; // Payment frequency
                    var rent=dd.rent; // Rent to be paid
                    var end_d=new Date(Date.parse(dd.end_date)); // End date of the lease
                    var start_d=new Date(Date.parse(dd.start_date)); // Start date of the lease
                
                    switch(dd.frequency) // Assign the correct payment frequency in numeric format to the variable
                    {
                        case "monthly": payFreq=28; break;
                        case "weekly": payFreq=7; break;
                        case "fortnightly": payFreq=14; break;
                        default: // Because the frequency is so important, stop the entire program if an unknown frequence is read
                            window.alert("Unknown payment frequency detected: "+dd.frequency);
                            throw new Error("Unknown frequency: "+dd.frequency);
                    }
                    // The timezone offset flag, if a payment period crosses over into daylight savings time
                    var tmz_offset=((start_d.getTimezoneOffset()!=addDays(start_d,payFreq-1).getTimezoneOffset() && payFreq<28) ?2 :1);
                    var lastPayDay=firstPayPeriod(start_d,dd.payment_day);

                    // The output data begins here
                    var p_output='<table class="pay_output">\n\t<tr>\n\t\t<td>From</td>\n\t\t<td>To</td>';

                    // The first record of payment
                    p_output+="\n\t\t<td>Days</td>\n\t\t<td>Amount</td>\n\t</tr>\n\t";
                    p_output+="<tr>\n\t\t<td>" +formatDate(start_d) +"</td>\n\t\t<td>" +formatDate(lastPayDay);
                    p_output+="</td>\n\t\t<td>" +(diffDays(start_d, lastPayDay) +tmz_offset) +"</td>\n\t\t<td>";
                    p_output+=rSum(diffDays(start_d, lastPayDay), rent, payFreq) +"</td>\n\t</tr>\n\t";

                    // Use the for loop to go through the rest of the payment dates
                    for (var x=addDays(lastPayDay,1); 1<=diffDays(x,end_d); x=addDays(x,payFreq))
                    {
                        var incr=((payFreq<28) ?0 :1);
                        var nextPay=(( payFreq>diffDays(x,end_d)) ?addDays(x,diffDays(x,end_d)+incr) :addDays(x,payFreq-1));
                        tmz_offset=((x.getTimezoneOffset()!=nextPay.getTimezoneOffset() && payFreq<28) ?2 :1);
                    
                        p_output+="<tr>\n\t\t<td>" +formatDate(x) +"</td>\n\t\t<td>" +formatDate(nextPay);
                        p_output+="</td>\n\t\t<td>" +(diffDays(x,nextPay) +tmz_offset) +"</td>\n\t\t<td>";
                        p_output+=rSum(diffDays(x,nextPay),rent,payFreq) +"</td>\n\t</tr>\n\t";
                    }
                    p_output+='</table>';
                    return p_output; // Send output to div element
                }
            }
            function showPayment(leaseID) // The main function that sends the call to the external API
            {
                var XMLHttp=new XMLHttpRequest();
                var payData=document.getElementById("payments");
                // No 0 or negative numbers allowed
                if (parseInt(leaseID)>0 || leaseID.trim().length==0 || leaseID.trim().indexOf("lease-")>-1)
                {
                    var query_str=((leaseID.trim().length>0) ?leaseID.trim().toString() :"");
                    XMLHttp.onreadystatechange=function()
                    {
                        if (this.readyState==4 && this.status==200)
                        {
                            // When the API responds send its data to the tableData function to be processed
                            payData.innerHTML=tableData(query_str.length, JSON.parse(this.responseText));
                        }
                    };
                    XMLHttp.open("GET","https://hiring-task-api.herokuapp.com/v1/leases/"+query_str, true);
                    XMLHttp.send();
                }
                else {
                    payData.innerText="0 or negative numbers are not allowed.";
                }
            }  