'use strict';
    const unlockedEndings = JSON.parse(localStorage.getItem('endings')) || []
    const $ = s => document.querySelector(s);
    const rnd = n => Math.floor(Math.random() * n);
    const pick = a => a[rnd(a.length)];
    const names = ['Bob', 'Gerald', 'Geraldine', 'Boris', 'Bobbius', 'Beefo', 'Kookie', 'Gerard', 'Mortimer', 'Gorglebop'];
    const menu = ['Buffalo wings', 'Nuclear wings', 'Slop nachos'];
    const conds = ['nuclear biohazard', 'nearly uninhabitable', 'filthy', 'messy', 'squeaky clean'];
    const taskDefs = [
    ['Clean the fryer', 3, 10], 
    ['Mop the floor', 2, 12], 
    ['Investigate suspicious sounds in the break room', 2, 5], 
    ['Attend meeting held by the chicken mascot', 4, 2],
    ['Discover why the freezer is warmer than the dining area', 2, 4],
    ['Tighten security to the experimental slop room', 4, 7],
    ['Replace the employee of the month photo (It\'s been the chicken the past 200 times)', 2, 1],
    ['Remove a suspiciously human-shaped stain from the ceiling',4, 1],
    ['Pay your respects to the chicken statue in the break room', 2, 3],
    ['Find out who keeps ordering the Nuclear Wings from 1842', 3, 5],
    ['Visit the grave of the forsaken discontinued menu item: The Nuclear Pizza Roll', 2, 5]
  ];
    let g = null;
    let screen = 'intro';
    let message = '';
    let log = [];
    let round = 0;
    let cs = 0;
    let hs = 0;
    let pattern = 0;
    const esc = s => String(s).replace(/[&<>"']/g, c => ({
    }[c]));
    
    let autoFinish = false;

    function toggleAutoFinish() {
        autoFinish = !autoFinish;
        render();
    }

    function note(s){
      message = s;
      log.unshift(s);
      log = log.slice(0, 16)
    }
    function cond(){
      return conds[Math.floor(Math.min(99, g.san)/20)]
    }
    function end(title, story){
      g.ended = true;
      screen = 'end';
      note(story);
      g.ending = title;
      if(!unlockedEndings.includes(title)){
        unlockedEndings.push(title)
        localStorage.setItem('endings',JSON.stringify(unlockedEndings))
      }
      render()
    }
    function init(diff, ret){
      g = {
        diff, ret, day: 1, action: 1, served: 0, completed: 0, money: 0, xp: 0, rep: 50, wage: 20, bonus: 1, paymult: 1, rank: 0, security: 0, san: 100, pantry: {
          'Buffalo wings': 100, 'Nuclear wings': 40, 'Slop nachos': 20
        }, customers: [], tasks: [], ended: false
      };
      log = [];
      note('WELCOME TO YOUR SHIFT AT WINGSLOP. The chicken expects excellence.');
      startShift()
    }
    function weighted(items, weights){
      let t = weights.reduce((a, b) => a+b, 0), r = Math.random()*t;
      for(let i = 0; i<items.length; i++){
        r -= weights[i];
        if(r<0)return items[i]
      }
      return items.at(-1)
    }
    function addTask(){
      let avail = taskDefs.filter(t => !g.tasks.some(a => a.name === t[0]));
      if(!avail.length)return;
      let t = weighted(avail, avail.map(x => x[2]));
      g.tasks.push({
        name: t[0], duration: t[1]+(g.san<60?1: 0), progress: 0
      })
    }
    function startShift(){
      for(let i = 0; i<[3, 3, 4, 4][g.diff]; i++)addTask();
      if(rnd(Math.max(50 - g.day, 10)) === 0){
        screen = 'records';
        note('The chicken has left the confidential corporate records room slightly open.\nAUTHORIZED PERSONNEL ONLY! VIOLATORS WILL BE DEALT WITH BY THE CHICKEN!')
      } else {
        screen = 'main'
      }
      render()
    }
    function records(enter){
      if(enter){
        if(rnd(4) === 0)return end('THE ONE WHO KNEW', 'You were a BIT too loud entering the room. The chicken caught you in the act. Goodbye, old friend.');
        if(rnd(10) === 0)note('You enter without being caught and find a confidential file:\nName: Harland Cluckanders\nAlias: The Chicken\nYear of Employment: 1842\nEmployer: [REDACTED]');
        else note('You enter without being caught, but find no interesting documents. Better luck next time...')
      } else note('You decide not to risk the wrath of the chicken.');
      screen = 'main';
      render()
    }
    function payroll(){
      let pay = (g.wage+g.bonus*5*g.completed+g.bonus*2*g.served)*g.paymult;
      g.money += pay;
      g.served = 0;
      g.completed = 0;
      g.paymult = 1;
      note(`You earn $${pay.toFixed(2)} for your shift! You now have $${g.money.toFixed(2)}.`);
      let ranks = [['Trainee', 0, 20, 1],
       ['Crew Member', 250, 30, 1.2], 
       ['Senior Slopmaker', 1000, 50, 1.5],
       ['Supreme Slop Scraper', 3000, 85, 2],
       ['Slopsistant Manager', 10000, 130, 2.75],
       ['WingSlop Manager', 35000, 200, 3.75],
       ['Regional Sloppager', 100000, 350, 5]
      ];
      if(g.rank < ranks.length - 1 && g.xp >= ranks[g.rank+1][1]){
        g.rank++;
        g.wage = ranks[g.rank][2];
        g.bonus = ranks[g.rank][3];
        note('Congratulations! Promoted to '+ranks[g.rank][0]+'!')
      }
      if(g.ret && g.day === 10)return end('EMPLOYEE OF THE MILLENNIUM', 'You have been working for the chicken for 10 days now! You must be a really hard worker!');
      if(g.ret && g.money >= 375)return end('THE GREAT ESCAPE', 'You now have enough money to never be financially dependent on the chicken again!')
    }
    function discipline(){
      if(!g.tasks.length)return;
      let repPenalty = g.rep <= 25?2: g.rep <= 40?1: 0, idx = Math.max(0, Math.min(2, Math.min(g.tasks.length, 2)+repPenalty-1));
      let p = weighted(['Written warning', 'Slop Nacho force feeding', 'Public humiliation', '10% Paycheck deduction', '30% Paycheck deduction', 'Termination'], [[50, 20, 5], [25, 25, 15], [15, 20, 20], [8, 20, 25], [1, 10, 20], [1, 5, 15]].map(a => a[idx]));
      note('THE CHICKEN HAS SUMMONED YOU. Unfinished assignments: '+g.tasks.length+'. DISCIPLINARY ACTION: '+p);
      if(p === 'Termination')return end('UNEMPLOYED', 'You have been fired from WingSlop.');
      if(p === 'Slop Nacho force feeding')g.xp = Math.max(0, g.xp-100);
      if(p === 'Public humiliation')g.rep = Math.max(0, g.rep-10);
      if(p === '10% Paycheck deduction')g.paymult = .9;
      if(p === '30% Paycheck deduction')g.paymult = .7
    }
    function tick(){
      if(g.action === 10){
        discipline();
        if(g.ended)return;
        payroll();
        if(g.ended)return;
        g.day++;
        g.action = 1
      } else g.action++;
      if(g.rep >= 100)return end('INNER CIRCLE', "Due to your high reputation with the chicken, you have been invited to his luncheon. Maybe he isn't so bad after all...")
      if(rnd([5, 4, 2, 1][g.diff]) === 0)g.san = Math.max(1, g.san-(3+rnd(8)));
      for(let i = g.customers.length-1; i >= 0; i--){
        let c = g.customers[i], offset = Math.floor((100-g.san)/5);
        c.patience = Math.max(0, c.patience-(5+offset+rnd(11)));
        if(c.patience === 0){
          g.rep -= 3;
          note(c.name+' ran out of patience! They are taking their business elsewhere.');
          g.customers.splice(i, 1)
        }
      }
      if(g.tasks.includes("Restock nuclear wings") && Math.random() < 0.1 && g.san <= 60){
        end('WINGNOBYL','A nuclear explosion occured at WingSlop. You AND the chicken no longer exist... Perhaps it had something to do with the lack of nuclear wings in stock...')
      }
      if(rnd([5, 4, 3, 2][g.diff]) === 0){
        let c = {
          name: pick(names), order: pick(menu), quantity: 1+rnd(5), patience: 50+rnd(51)
        };
        g.customers.push(c);
        note('A customer enters WingSlop. Say hi to '+c.name+'!')
      }
      if(g.action === 1){
        startShift();
        return
      }
      screen = 'main';
      render()
    }
    function checkInspector(){
      if(g.san<20 && rnd(g.san) === 0){
        if(g.diff === 3 && rnd(5) === 0){
          screen = 'name';
          note('A health inspector has arrived. He demands to know the owner\'s full government name.');
          render();
          return true
        }
        end('CAUTION: BIOHAZARD', 'A health inspector has arrived. WingSlop has been deemed a biohazard and a threat to humanity and chickenkind.');
        return true
      }
      return false
    }
    function act(type, index){
      if(g.ended)return;
      if(checkInspector())return;
      if(type === 'wait'){
        note('You wait. The chicken does not approve of idleness.');
        tick();
        return
      }
      if(type === 'work'){
        let t = g.tasks[index];
        if(!t)return;
        if(g.san<40 && rnd(5) === 4){
          note('You attempt to '+t.name.toLowerCase()+', but the restaurant\'s lack of sanitation stops you.');
          tick();
          return
        }
        t.progress++;
        note(`'${t.name}' worked on! Progress: ${t.progress}/${t.duration}`);
        if(t.progress >= t.duration){
          g.xp += t.duration*10;
          g.completed++;
          if(t.name === 'Mop the floor'){
            g.san += (Math.ceil(Math.random()*5))*5
            note('WingSlop has been cleaned. Sanitation is now '+cond()+'.')
          }
          if(t.name === 'Tighten security to the experimental slop room'){
            g.security++;
            if(g.security >= 10)return end('FORT KNOX', 'The chicken congratulates you on your commitment to security. No one will EVER know what happens behind the experimental slop room door. You will NEVER leave WingSlop.')
          }
          if(t.name.startsWith('Restock ')){
            let item = menu.find(x => t.name === 'Restock '+x.toLowerCase());
            if(item)g.pantry[item] += {
              'Buffalo wings': 50, 'Nuclear wings': 25, 'Slop nachos': 20
            }[item]
          }
          g.tasks.splice(index, 1);
          note(`'${t.name}' task complete! (+${t.duration*10} XP)`)
        }
        tick();
        return
      }
      if(type === 'serve'){
        let c = g.customers[index];
        if(!c)return;
        if(g.pantry[c.order]<c.quantity)note('The kitchen does not have enough '+c.order+' to fulfill the order.');
        else if(g.san<40 && rnd(5) === 4)note('The fryer refused to turn on. Order could not be prepared.');
        else {
          g.pantry[c.order] -= c.quantity;
          g.xp += 50;
          g.rep += 2;
          g.served++;
          g.customers.splice(index, 1);
          note('You served '+c.name+'! (+50 XP)');
          for(let item of menu){
            if(g.pantry[item] <= 12 && !g.tasks.some(t => t.name === 'Restock '+item.toLowerCase()))g.tasks.push({
              name: 'Restock '+item.toLowerCase(), duration: item === 'Slop nachos'?4: 3, progress: 0
            })
          }
        }
        tick()
      }
    }
    function workTask(index){
      if(!autoFinish){
        act('work', index)
      }
      else{
        const task = g.tasks[index]
        const startingDay = g.day
        while(g.tasks.includes(task) && g.day === startingDay && !g.ended){
              act('work', g.tasks.indexOf(task))
              if(screen !== 'main'){
                break
              }
            }
          }
        }
    function submitName(){
      let name = $('#nameGuess').value.trim().toLowerCase();
      if(name !== 'harland cluckanders')return end('CAUTION: BIOHAZARD', 'The inspector is angered that you did not tell him the chicken\'s government name. WingSlop has been shut down.');
      cs = 0;
      hs = 0;
      round = 0;
      pattern = 0;
      screen = 'rps';
      note('The inspector calls Harland Cluckanders. The chicken runs over. They begin playing ROCK PAPER SCISSORS, first to 5. You control the chicken.');
      render()
    }
    function rps(move){
      let im = round === 0?rnd(3): [1, 2, 0][(round-1)%3];
      let nm = ['Rock', 'Paper', 'Scissors'];
      let result = (move-im+3)%3;
      if(result === 1)cs++;
      else if(result === 2)hs++;
      round++;
      note(`Round ${round}: Chicken throws ${nm[move]}. Inspector throws ${nm[im]}. ${result===0?'TIE!':result===1?'CHICKEN WINS!':'INSPECTOR WINS!'} Score ${cs}–${hs} (chicken first).`);
      if(cs >= 5)return end('ARMAGEDDON', 'Congratulations! The chicken won! That may not be best for you, though. You still work at WingSlop, and he knows you somehow learned his government name...');
      if(hs >= 5)return end('CAUTION: BIOHAZARD', 'The inspector defeated the chicken at rock-paper-scissors and condemned WingSlop as a biohazard.');
      render()
    }

    let main;

    function heading(text) {
        let element = document.createElement("h2");
        element.textContent = text;
        main.append(element);
    }

    function paragraph(text) {
        let element = document.createElement("div");
        element.className = "story";
        element.textContent = text;
        main.append(element);
    }

    function button(text, onClick) {
        let element = document.createElement("button");
        element.textContent = text;
        element.onclick = onClick;
        return element;
    }

    function buttons(options) {
        let container = document.createElement("div");
        container.className = "actions";
        main.append(container);

        for (let option of options) {
            container.append(button(option[0], option[1]));
        }
    }

    function goTo(newScreen) {
        screen = newScreen;
        render();
    }

    function backButton() {
        buttons([["← BACK TO TERMINAL", () => goTo("main")]]);
    }

    function showStats() {
        let stats = document.createElement("div");
        stats.className = "stats";
        let values = [
            ["DAY / ACTION", g.day + " / " + g.action],
            ["SANITATION", g.san + "%"],
            ["REPUTATION", g.rep],
            ["MONEY", "$" + g.money.toFixed(2)],
            ["XP", g.xp],
            ["SECURITY", g.security]
        ];

        for (let [label, value] of values) {
            let stat = document.createElement("div");
            stat.className = "stat";
            stat.textContent = label;
            let number = document.createElement("strong");
            number.textContent = value;
            stat.append(number);
            stats.append(stat);
        }

        main.append(stats);
        main.append(button(
            `Auto-Finish: ${autoFinish ? "ON" : "OFF"}`,
            toggleAutoFinish
        ));
    }

    function showLog() {
        if (log.length === 0) return;
        let element = document.createElement("div");
        element.className = "log";
        element.textContent = "SHIFT LOG\n" + log.slice(0, 6).join("\n———\n");
        main.append(element);
    }

    // ===== INDIVIDUAL SCREENS =====
    function showIntro() {
        if(unlockedEndings.length > 0){
        heading("WELCOME BACK, SLOPMAKER");
        }
        else{
        heading("WELCOME, FUTURE SLOPMAKER");
        }
        paragraph("Endings unlocked: "+unlockedEndings.length+"/9")
        paragraph("Employment is mandatory. Benefits are classified.\n\nChoose your difficulty and retirement policy.");
        buttons([
            ["1. MILD", () => choose(0)],
            ["2. MEDIUM", () => choose(1)],
            ["3. SPICY", () => choose(2)],
            ["4. NUCLEAR", () => choose(3)]
        ]);
    }

    function showRetirement() {
        heading("RETIREMENT POLICY");
        paragraph("Enable retirement endings? (Day 10 or $375.)");
        buttons([
            ["Yes", () => init(chosenDiff, true)],
            ["No", () => init(chosenDiff, false)]
        ]);
    }

    function showEnding() {
        heading("ENDING UNLOCKED: " + g.ending);
        paragraph("Total endings unlocked: "+unlockedEndings.length+"/9")
        paragraph(message);
        buttons([["START ANOTHER SHIFT (NEW GAME)", () => {
            g = null;
            goTo("intro");
        }]]);
    }

    function showRecords() {
        heading("CONFIDENTIAL RECORDS");
        paragraph(message);
        buttons([
            ["ENTER THE ROOM", () => records(true)],
            ["GO ABOUT YOUR NORMAL DAY", () => records(false)]
        ]);
    }

    function showInspector() {
        heading("HEALTH INSPECTOR");
        paragraph(message);
        let label = document.createElement("label");
        label.textContent = "Owner’s full government name";
        main.append(label);
        let input = document.createElement("input");
        input.id = "nameGuess";
        input.autocomplete = "off";
        main.append(input);
        buttons([["ANSWER THE INSPECTOR", submitName]]);
    }

    function showRPS() {
        heading("ARMAGEDDON — FINAL CONFRONTATION");
        paragraph(message + "\n\nCHICKEN: " + cs + "   INSPECTOR: " + hs + "\nFIRST TO 5 WINS.");
        buttons([
            ["✊ ROCK", () => rps(0)],
            ["✋ PAPER", () => rps(1)],
            ["✌️ SCISSORS", () => rps(2)]
        ]);
    }

    function showMainMenu() {
        heading("WINGSLOP EMPLOYEE TERMINAL");
        if (message) paragraph(message);
        buttons([
            ["WORK ON TASK", () => goTo("work")],
            ["SERVE CUSTOMER", () => goTo("serve")],
            ["CHECK INVENTORY", () => goTo("pantry")],
            ["CHECK SANITATION", () => goTo("sanitation")],
            ["WAIT (1 ACTION)", () => act("wait")]
        ]);
    }

    function showTasks(canWork) {
        heading("CURRENT ASSIGNMENTS");
        if (message) paragraph(message);

        if (g.tasks.length === 0) {
            paragraph("No active tasks.");
        } else {
            let taskList = g.tasks.map((task, i) =>
                `${i + 1}. ${task.name} (${task.progress}/${task.duration})`
            );
            paragraph(taskList.join("\n"));
        }

        if (canWork) {
            buttons(g.tasks.map((task, i) => [
                task.name,
                () => workTask(i)
            ]));
        }
        backButton();
    }

    function showCustomers(canServe) {
        heading("CUSTOMER ORDERS");
        if (message) paragraph(message);

        if (g.customers.length === 0) {
            paragraph("No customers currently waiting.");
        } else {
            let customerList = g.customers.map((customer, i) =>
                `${i + 1}. ${customer.name} wants ${customer.quantity} ${customer.order} (${customer.patience} patience)`
            );
            paragraph(customerList.join("\n"));
        }

        if (canServe) {
            buttons(g.customers.map((customer, i) => [
                "SERVE " + customer.name + " — " + customer.order,
                () => act("serve", i)
            ]));
        }
        backButton();
    }

    function showPantry() {
        heading("WINGSLOP PANTRY");
        if (message) paragraph(message);
        paragraph(menu.map(item => `${item}: ${g.pantry[item]}`).join("\n"));
        backButton();
    }

    function showSanitation() {
        heading("SANITATION REPORT");
        if (message) paragraph(message);
        paragraph("WingSlop is currently in a " + cond() + " sanitation state. (" + g.san + "%)");
        backButton();
    }

    // ===== DRAW THE CURRENT SCREEN =====
    function render() {
        let app = document.querySelector("#app");
        app.innerHTML = "";
        main = document.createElement("main");
        app.append(main);

        if (screen === "intro") return showIntro();
        if (screen === "ret") return showRetirement();

        showStats();

        if (screen === "end") return showEnding();
        if (screen === "records") return showRecords();
        if (screen === "name") return showInspector();
        if (screen === "rps") return showRPS();

        if (screen === "main") showMainMenu();
        if (screen === "tasks") showTasks(false);
        if (screen === "work") showTasks(true);
        if (screen === "customers") showCustomers(false);
        if (screen === "serve") showCustomers(true);
        if (screen === "pantry") showPantry();
        if (screen === "sanitation") showSanitation();

        showLog();
    }

    let chosenDiff = 0;
    function choose(n){
      chosenDiff = n;
      screen = 'ret';
      render()
    }
    render();
