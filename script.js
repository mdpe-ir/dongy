let participants = [];
let expenses = [];
let settlement = {};

// Local Storage functions
function saveToLocalStorage() {
    localStorage.setItem('dongyParticipants', JSON.stringify(participants));
    localStorage.setItem('dongyExpenses', JSON.stringify(expenses));
}

function loadFromLocalStorage() {
    const savedParticipants = localStorage.getItem('dongyParticipants');
    const savedExpenses = localStorage.getItem('dongyExpenses');

    if (savedParticipants) {
        participants = JSON.parse(savedParticipants);
        updateParticipantList();
        updateParticipantSelects();
        document.getElementById('expenseForm').classList.toggle('hidden', participants.length < 2);
    }

    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        updateExpenseList();
        calculateSettlement();
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    showTab('participants');
});

// Currency formatting function
function formatCurrency(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Parse currency input
function parseCurrency(currencyStr) {
    return parseInt(currencyStr.replace(/,/g, ''), 10) || 0;
}

// Enhance expense amount input
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('expenseAmount').addEventListener('input', function (e) {
        let value = this.value.replace(/[^0-9]/g, '');
        this.value = formatCurrency(value);
    });
});

function addParticipant() {
    const participantNameInput = document.getElementById('participantName');
    const participantName = participantNameInput.value.trim();
    const errorDiv = document.getElementById('error');

    if (!participantName) {
        errorDiv.textContent = 'لطفاً نام شرکت‌کننده را وارد کنید';
        return;
    }

    if (participants.includes(participantName)) {
        errorDiv.textContent = 'این نام قبلاً ثبت شده است';
        return;
    }

    errorDiv.textContent = '';
    participants.push(participantName);
    saveToLocalStorage();
    updateParticipantList();
    updateParticipantSelects();
    participantNameInput.value = '';
    document.getElementById('expenseForm').classList.toggle('hidden', participants.length < 2);
}

function updateParticipantList() {
    const participantListDiv = document.getElementById('participantList');
    participantListDiv.innerHTML = participants.map((participant, index) => `
        <div class="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
            <span>${participant}</span>
            <button 
                onclick="removeParticipant(${index})" 
                class="bg-red-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-red-600 transition duration-300"
            >
                حذف
            </button>
        </div>
    `).join('');
}

function removeParticipant(index) {
    const removedParticipant = participants[index];
    participants.splice(index, 1);
    updateParticipantList();
    updateParticipantSelects();
    document.getElementById('expenseForm').classList.toggle('hidden', participants.length < 2);
    expenses = expenses.filter(expense =>
        expense.paidBy !== removedParticipant &&
        !expense.sharedBy.includes(removedParticipant)
    );
    saveToLocalStorage();
    updateExpenseList();
    calculateSettlement();
}

function updateParticipantSelects() {
    const paidBySelect = document.getElementById('paidBy');
    const sharedBySelect = document.getElementById('sharedBy');

    paidBySelect.innerHTML = '<option value="">پرداخت کننده</option>';
    sharedBySelect.innerHTML = '';

    participants.forEach(participant => {
        const paidOption = document.createElement('option');
        paidOption.value = participant;
        paidOption.textContent = participant;
        paidBySelect.appendChild(paidOption);

        const sharedOption = document.createElement('option');
        sharedOption.value = participant;
        sharedOption.textContent = participant;
        sharedBySelect.appendChild(sharedOption);
    });
}

function addExpense() {
    const description = document.getElementById('expenseDescription').value.trim();
    const expenseAmount = parseCurrency(document.getElementById('expenseAmount').value);
    const paidBy = document.getElementById('paidBy').value;
    const sharedBy = Array.from(document.getElementById('sharedBy').selectedOptions).map(opt => opt.value);

    const errorDiv = document.getElementById('error');

    if (!description) {
        errorDiv.textContent = 'لطفاً توضیح هزینه را وارد کنید';
        return;
    }
    if (expenseAmount <= 0) {
        errorDiv.textContent = 'لطفاً مبلغ معتبر وارد کنید';
        return;
    }
    if (!paidBy) {
        errorDiv.textContent = 'لطفاً پرداخت کننده را انتخاب کنید';
        return;
    }
    if (sharedBy.length === 0) {
        errorDiv.textContent = 'لطفاً افراد سهیم در هزینه را انتخاب کنید';
        return;
    }

    errorDiv.textContent = '';

    const expense = {
        description,
        expenseAmount,
        paidBy,
        sharedBy
    };

    expenses.push(expense);
    saveToLocalStorage();
    updateExpenseList();
    calculateSettlement();

    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('paidBy').selectedIndex = 0;
    document.getElementById('sharedBy').selectedIndex = -1;
}

function updateExpenseList() {
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = expenses.map((expense, index) => `
        <div class="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
            <div>
                <div class="font-bold">${expense.description}</div>
                <div class="text-sm text-gray-600">
                    ${formatCurrency(expense.expenseAmount)} تومان 
                    (پرداخت توسط ${expense.paidBy}، تقسیم بین: ${expense.sharedBy.join(', ')})
                </div>
            </div>
            <div class="flex gap-2">
                <button 
                    onclick="editExpense(${index})" 
                    class="bg-blue-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-blue-600 transition duration-300"
                >
                    ویرایش
                </button>
                <button 
                    onclick="deleteExpense(${index})" 
                    class="bg-red-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-red-600 transition duration-300"
                >
                    حذف
                </button>
            </div>
        </div>
    `).join('');
}

function editExpense(index) {
    const expense = expenses[index];
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = formatCurrency(expense.expenseAmount);
    document.getElementById('paidBy').value = expense.paidBy;

    const sharedBySelect = document.getElementById('sharedBy');
    Array.from(sharedBySelect.options).forEach(option => {
        option.selected = expense.sharedBy.includes(option.value);
    });

    expenses.splice(index, 1);
    saveToLocalStorage();
    updateExpenseList();
    calculateSettlement();

    showTab('expenses');
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveToLocalStorage();
    updateExpenseList();
    calculateSettlement();
}

function calculateSettlement() {
    const totalPaidBy = {};
    const totalSharedBy = {};

    participants.forEach(person => {
        totalPaidBy[person] = 0;
        totalSharedBy[person] = 0;
    });

    expenses.forEach(expense => {
        totalPaidBy[expense.paidBy] += expense.expenseAmount;
        const sharePerPerson = expense.expenseAmount / expense.sharedBy.length;
        expense.sharedBy.forEach(person => {
            totalSharedBy[person] += sharePerPerson;
        });
    });

    settlement = {};
    participants.forEach(person => {
        settlement[person] = totalPaidBy[person] - totalSharedBy[person];
    });

    const transactions = calculateTransactions();

    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = `
        <h2 class="text-lg font-bold mb-3 text-center">خلاصه محاسبات</h2>
        ${participants.map(person => {
        const amount = settlement[person];
        const status = amount > 0 ? 'طلبکار' : amount < 0 ? 'بدهکار' : 'تسویه';
        const absAmount = Math.abs(amount);
        return `
                <div class="flex justify-between items-center mb-2 p-2 rounded-lg ${status === 'طلبکار' ? 'bg-green-100' :
                status === 'بدهکار' ? 'bg-red-100' : 'bg-gray-200'
            }">
                    <span class="font-medium">${person}</span>
                    <span class="text-sm">
                        ${formatCurrency(Math.round(absAmount / 1000) * 1000)} تومان 
                        ${status === 'طلبکار' ? '👍 طلبکار' : status === 'بدهکار' ? '👀 بدهکار' : '✅ تسویه'}
                    </span>
                </div>
            `;
    }).join('')}
        <h3 class="text-md font-bold mt-6 mb-2">تراکنش‌های پیشنهادی</h3>
        ${transactions.length === 0 ?
            '<p class="text-gray-500">هیچ تراکنشی لازم نیست.</p>' :
            transactions.map(t => {
                const amount = Math.round(t.amount);
                return `
                    <div class="flex justify-between items-center bg-blue-100 p-2 rounded-lg mb-2">
                        <span>${t.from} ← ${t.to}</span>
                        <span>${formatCurrency(amount)} تومان</span>
                    </div>
                `;
            }).join('')
        }
    `;
}

function calculateTransactions() {
    const debtors = [];
    const creditors = [];
    const epsilon = 0.01;

    for (const person in settlement) {
        const amount = settlement[person];
        if (amount < -epsilon) {
            debtors.push({ person, amount: -amount });
        } else if (amount > epsilon) {
            creditors.push({ person, amount });
        }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];

    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        const transactionAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.person,
            to: creditor.person,
            amount: transactionAmount
        });

        debtor.amount -= transactionAmount;
        creditor.amount -= transactionAmount;

        if (debtor.amount < epsilon) {
            debtors.shift();
        }
        if (creditor.amount < epsilon) {
            creditors.shift();
        }
    }

    return transactions;
}

function showTab(tabName) {
    document.getElementById('participantsSection').classList.add('hidden');
    document.getElementById('expensesSection').classList.add('hidden');
    document.getElementById('settlementSection').classList.add('hidden');

    document.getElementById('participantsTab').classList.remove('bg-white', 'shadow-sm');
    document.getElementById('expensesTab').classList.remove('bg-white', 'shadow-sm');
    document.getElementById('settlementTab').classList.remove('bg-white', 'shadow-sm');

    document.getElementById(tabName + 'Section').classList.remove('hidden');
    document.getElementById(tabName + 'Tab').classList.add('bg-white', 'shadow-sm');
}

function exportToExcel() {
    if (Object.keys(settlement).length === 0) {
        calculateSettlement();
    }

    let csvContent = "نام,وضعیت,مبلغ (تومان)\n";
    participants.forEach(person => {
        const amount = settlement[person];
        const status = amount > 0 ? 'طلبکار' : amount < 0 ? 'بدهکار' : 'تسویه';
        const absAmount = Math.abs(amount);
        csvContent += `${person},${status},${Math.round(absAmount / 1000) * 1000}\n`;
    });

    csvContent += "\nتوضیح هزینه,مبلغ,پرداخت کننده,تقسیم بین\n";
    expenses.forEach(expense => {
        csvContent += `${expense.description},${expense.expenseAmount},${expense.paidBy},"${expense.sharedBy.join(', ')}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'expenses_settlement.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}