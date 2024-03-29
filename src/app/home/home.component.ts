import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  transactions: any[] = [];
  name: string = "";
  isSufficient: boolean = true;
  id: string = "";
  isAdmin: boolean = false;
  spendStatus: number = 0;
  viewBy: string = "month";
  value: string = "";
  for: string = "";
  users: any[] = [];
  fetchedByDay:boolean=true;
  selectedUserId: string = String(localStorage.getItem("userId"));
  creditBalance: string = "";
  amountforTransaction: string = "";
  availableBalance: number = 0;
  totalCreditedBalance: number = 0;
  dueDetailsOfUser: any = [];
  detailedIndex: any = null;
  newDateForChange: string = "";
  transactionId: string = "";
  viewHome:boolean=false;
  constructor(private toastr: ToastrService, public router: Router, public service: ApiService) { }
  ngOnInit() {
    var today = new Date(2023,11,22);
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    this.value = dd + '/' + mm + '/' + yyyy;
    this.id = "" + localStorage.getItem("userId");
    this.service.getUserById(String(localStorage.getItem("userId"))).subscribe({
      next: (data) => {
        console.log(data);
        this.name = data[0].firstName;
        this.isAdmin = data[0].isAdmin;
      },
      error: (message) => {
        console.log(message);
      }
    })
    this.service.getAllUsers().subscribe({
      next: (data) => {
        console.log(data);
        this.users = data;
      },
      error: (message) => {
        console.log(message);
      }
    })
    var months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    var today = new Date(2023,11,22);
    this.value = months[today.getMonth()];
    this.transactions = [];
    this.service.getAllTransactions(this.viewBy).subscribe({
      next: (data) => {
        console.log(data);
        data.forEach((t: any) => {
          t.timeStamp = t.timeStamp.split('T')[0].toString();
        });
        var lastDate = data[0].timeStamp;
        var i = 1;
        this.transactions[0] = { date: data[0].timeStamp, isTransaction: false };
        data.forEach((t: any) => {
          if (lastDate != t.timeStamp) {
            this.transactions.push({ date: t.timeStamp, isTransaction: false });
            lastDate = t.timeStamp;
          }
          t.index = i++;
          t.isTransaction = true;
          this.transactions.push(t);
        });
        console.log(this.transactions);
        this.viewHome=true;
      },
      error: (message) => {
        console.log(message);
      }
    })
    this.updateBalance();
  }
  toOldStatsPage() {
    this.router.navigate(['old-stats']);
  }
  toLogsPage() {
    this.router.navigate(['logs']);
  }
  addBalance() {
    this.service.createTransaction({ userId: this.selectedUserId, amount: Number(this.creditBalance), for: "SF06", isCredited: true }).subscribe({
      next: (data) => {
        this.updateBalance();
        this.for = "";
        this.selectedUserId = "";
        this.creditBalance = "";
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  updateBalance() {
    this.service.getAvailableBalance().subscribe({
      next: (data) => {
        this.service.getTotalCreditedAmount().subscribe({
          next: (data) => {
            console.log(data);
            this.totalCreditedBalance = data.amount;
            this.calculateSpendoMeter();
            this.service.getDuesDetail().subscribe({
              next: (data) => {
                console.log(data);
                this.dueDetailsOfUser = data;
              },
              error: (message) => {
                console.log(message);
              }
            })
          },
          error: (message) => {
            console.log(message);
          }
        })
        console.log(data);
        this.availableBalance = data.balance;
        if (this.availableBalance > 1000) {
          this.isSufficient = true;
        }
        else {
          this.isSufficient = false;
        }
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  updateValue() {
    if (this.viewBy == "day") {
      this.fetchedByDay=false;
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      this.value = dd + '/' + mm + '/' + yyyy;
      this.transactions = [];
      this.service.getAllTransactions(this.viewBy).subscribe({
        next: (data) => {
          console.log(data);
          this.fetchedByDay=true;
          var i = 1;
          data.forEach((t: any) => {
            t.index = i++;
            t.isTransaction = true;
          });
          this.transactions = data;
        },
        error: (message) => {
          console.log(message);
        }
      })
    }
    else if (this.viewBy == "week") {
      var date1 = new Date();
      var date2 = new Date();
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "June",
        "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
      var day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      date1.setDate(date1.getDate() - date1.getDay() + 1);
      date2.setDate(date2.getDate() - date2.getDay());
      var startDayOfWeek = date1;
      date2.setDate(date2.getDate() + 7);
      var endDayOfWeek = date2;
      this.value = startDayOfWeek.getDate().toString() + " " + months[startDayOfWeek.getMonth()] + " - " + endDayOfWeek.getDate().toString() + " " + months[endDayOfWeek.getMonth()];
      this.transactions = [];
      this.service.getAllTransactions(this.viewBy).subscribe({
        next: (data) => {
          console.log(data);
          data.forEach((t: any) => {
            t.timeStamp = (new Date(t.timeStamp).getDay() - 1);
          });
          var lastDay = data[0].timeStamp;
          var i = 1;
          this.transactions[0] = { date: day[data[0].timeStamp], isTransaction: false };
          data.forEach((t: any) => {
            if (lastDay != t.timeStamp) {
              this.transactions.push({ date: day[t.timeStamp], isTransaction: false });
              lastDay = t.timeStamp;
            }
            t.index = i++;
            t.isTransaction = true;
            this.transactions.push(t);
          });
          console.log(this.transactions);
        },
        error: (message) => {
          console.log(message);
        }
      })
    }
    else if (this.viewBy == "month") {
      var months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      var today = new Date();
      this.value = months[today.getMonth()];
      this.transactions = [];
      this.service.getAllTransactions(this.viewBy).subscribe({
        next: (data) => {
          console.log(data);
          data.forEach((t: any) => {
            t.timeStamp = t.timeStamp.split('T')[0].toString();
          });
          var lastDate = data[0].timeStamp;
          var i = 1;
          this.transactions[0] = { date: data[0].timeStamp, isTransaction: false };
          data.forEach((t: any) => {
            if (lastDate != t.timeStamp) {
              this.transactions.push({ date: t.timeStamp, isTransaction: false });
              lastDate = t.timeStamp;
            }
            t.index = i++;
            t.isTransaction = true;
            this.transactions.push(t);
          });
          console.log(this.transactions);
        },
        error: (message) => {
          console.log(message);
        }
      })
    }
  }
  clearDues(userId: string) {
    this.service.clearDuesForUser(userId).subscribe({
      next: (data) => {
        console.log(data);
        this.updateValue();
        this.updateBalance();
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  updateUserTransaction() {
    this.service.updateTransaction({ userId: localStorage.getItem("userId"), amount: Number(this.amountforTransaction), for: this.for }, this.transactionId).subscribe({
      next: (data) => {
        console.log(data);
        this.updateValue();
        this.updateBalance();
        this.for = "";
        this.transactionId = "";
        this.amountforTransaction = "";
        this.detailedIndex = null;
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  addCurrentDateForTransaction() {
    this.newDateForChange = this.transactions[this.detailedIndex].timeStamp.split("T")[0];
  }
  updateUserTransactionDate() {
    this.service.updateTransaction({ timeStamp: (this.newDateForChange) }, this.transactionId).subscribe({
      next: (data) => {
        console.log(data);
        this.updateValue();
        this.for = "";
        this.transactionId = "";
        this.amountforTransaction = "";
        this.detailedIndex = null;
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  addTransaction() {
    if ((Number.isNaN(this.amountforTransaction) || this.amountforTransaction == "") && this.for == "") {
      this.toastr.error('Invalid values');
      return;
    }
    if (Number.isNaN(Number(this.amountforTransaction)) || this.amountforTransaction == "") {
      this.toastr.error('Invalid amount');
      return;
    }
    if (this.for == "") {
      this.toastr.error('Invalid for');
      return;
    }
    this.service.createTransaction({ userId: localStorage.getItem("userId"), amount: Number(this.amountforTransaction), for: this.for }).subscribe({
      next: (data) => {
        console.log(data);
        this.updateValue();
        this.updateBalance();
        this.for = "";
        this.amountforTransaction = "";
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  deleteTransaction() {
    this.service.removeTransaction(this.transactionId).subscribe({
      next: (data) => {
        this.transactionId = "";
        this.for = "";
        this.amountforTransaction = "";
        this.updateBalance();
        this.updateValue();
        this.detailedIndex = null;
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  updateTransaction(id: string, i: number) {
    this.service.updateTransaction({ isPaidBack: true }, id).subscribe({
      next: (data) => {
        console.log(data);
        this.transactions[i].isPaidBack = data.isPaidBack;
        this.service.getAvailableBalance().subscribe({
          next: (data) => {
            console.log(data);
            this.availableBalance = data.balance;
            if (this.availableBalance > 1000) {
              this.isSufficient = true;
            }
            else {
              this.isSufficient = false;
            }
            this.service.getDuesDetail().subscribe({
              next: (data) => {
                console.log(data);
                this.dueDetailsOfUser = data;
              },
              error: (message) => {
                console.log(message);
              }
            })
          },
          error: (message) => {
            console.log(message);
          }
        })
        this.calculateSpendoMeter();
      },
      error: (message) => {
        console.log(message);
      }
    })
  }
  detailedTransaction(index: number) {
    this.detailedIndex = index;
    this.selectedUserId = this.transactions[this.detailedIndex].userId;
    this.transactionId = this.transactions[this.detailedIndex]._id;
  }
  populateEditModal() {
    this.for = this.transactions[this.detailedIndex].for;
    this.amountforTransaction = this.transactions[this.detailedIndex].amount;
  }
  calculateSpendoMeter() {
    var now = new Date();
    var dayNumber = now.getDate();
    var totalDaysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var averageSpendForADay = this.totalCreditedBalance / totalDaysInCurrentMonth;
    var totalSpentTillDate = this.totalCreditedBalance - this.availableBalance;
    if (averageSpendForADay * dayNumber > totalSpentTillDate) {
      this.spendStatus = 3;
    }
    else if ((averageSpendForADay * dayNumber == totalSpentTillDate)) {
      this.spendStatus = 2;
    }
    else {
      this.spendStatus = 1;
    }
  }

}
