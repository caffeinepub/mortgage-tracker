import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Persistent Data Structures
  let accounts = Map.empty<Principal, Account>();

  // Data Types
  public type Account = {
    userProfile : UserProfile;
    houses : Map.Map<Text, House>;
    payments : List.List<Payment>;
  };

  public type House = {
    id : Text;
    name : Text;
    totalCost : Float;
    interestRate : Float;
    loanTermYears : Nat;
    downPayment : Float;
    createdAt : Int;
  };

  public type Payment = {
    amount : Float;
    date : Int;
    note : Text;
    houseId : Text;
    paymentMethod : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  public type DashboardSummary = {
    totalHouses : Nat;
    totalCost : Float;
    totalPaid : Float;
    remainingBalance : Float;
    totalInterest : Float;
    overallProgress : Float;
    totalPayments : Nat;
  };

  public type HouseProgress = {
    totalPaid : Float;
    remainingBalance : Float;
    progressPercentage : Float;
    interestAmount : Float;
    downPayment : Float;
    loanTermYears : Nat;
    totalLoanAmount : Float;
  };

  public type HouseWithProgress = {
    house : House;
    totalPaid : Float;
    remainingBalance : Float;
    progressPercentage : Float;
    interestAmount : Float;
    totalAmountToPay : Float;
  };

  public type AppVersion = {
    major : Nat;
    minor : Nat;
    patch : Nat;
    build : Nat;
  };

  let currentVersion : AppVersion = {
    major = 1;
    minor = 0;
    patch = 0;
    build = 0;
  };

  // Utility comparator for sorting payments by date (descending)
  module Payment {
    public func compare(a : Payment, b : Payment) : Order.Order {
      Int.compare(b.date, a.date);
    };
  };

  // Enable authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Functions
  func getAccountHelper(caller : Principal) : Account {
    let maybeAccount = accounts.get(caller);
    switch (maybeAccount) {
      case (null) {
        // Create default account for new users
        let defaultAccount : Account = {
          userProfile = { name = "" };
          houses = Map.empty<Text, House>();
          payments = List.empty<Payment>();
        };
        accounts.add(caller, defaultAccount);
        defaultAccount;
      };
      case (?account) { account };
    };
  };

  func updateAccount(caller : Principal, newAccount : Account) {
    accounts.add(caller, newAccount);
  };

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let account = getAccountHelper(caller);
    let updatedAccount : Account = {
      account with
      userProfile = profile;
    };
    updateAccount(caller, updatedAccount);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    let account = getAccountHelper(caller);
    ?account.userProfile;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    let account = getAccountHelper(user);
    ?account.userProfile;
  };

  // House Management
  public shared ({ caller }) func addOrUpdateHouse(house : House) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage houses");
    };

    let account = getAccountHelper(caller);
    let userHouseMap = account.houses;
    userHouseMap.add(house.id, house);

    let updatedAccount : Account = {
      account with
      houses = userHouseMap;
    };
    updateAccount(caller, updatedAccount);
  };

  public shared ({ caller }) func deleteHouse(houseId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete houses");
    };

    let account = getAccountHelper(caller);
    let userHouseMap = account.houses;

    switch (userHouseMap.get(houseId)) {
      case (?_house) {
        userHouseMap.remove(houseId);
      };
      case (null) {
        Runtime.trap("House not found or does not belong to you");
      };
    };

    let filteredPayments = account.payments.filter(
      func(payment) {
        payment.houseId != houseId;
      }
    );

    let updatedAccount : Account = {
      account with
      houses = userHouseMap;
      payments = filteredPayments;
    };
    updateAccount(caller, updatedAccount);
  };

  public query ({ caller }) func getHouse(houseId : Text) : async ?House {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view houses");
    };

    let account = getAccountHelper(caller);
    account.houses.get(houseId);
  };

  public query ({ caller }) func getAllHouses() : async [House] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view houses");
    };

    let account = getAccountHelper(caller);
    account.houses.values().toArray();
  };

  // Payment Recording
  public shared ({ caller }) func addPayment(amount : Float, note : Text, houseId : Text, paymentMethod : Text, maybeDate : ?Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payments");
    };

    let account = getAccountHelper(caller);
    let houseExists = switch (account.houses.get(houseId)) {
      case (?_house) { true };
      case (null) { false };
    };

    if (not houseExists) {
      Runtime.trap("Unauthorized: House not found or does not belong to you");
    };

    let payment : Payment = {
      amount;
      date = switch (maybeDate) {
        case (?d) { d };
        case (null) { Time.now() };
      };
      note;
      houseId;
      paymentMethod;
    };

    account.payments.add(payment);

    let updatedAccount : Account = {
      account with
      payments = account.payments;
    };
    updateAccount(caller, updatedAccount);
  };

  // Payment Editing
  public shared ({ caller }) func editPayment(paymentIndex : Nat, amount : Float, note : Text, houseId : Text, paymentMethod : Text, date : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit payments");
    };

    let account = getAccountHelper(caller);
    let houseExists = switch (account.houses.get(houseId)) {
      case (?_house) { true };
      case (null) { false };
    };

    if (not houseExists) {
      Runtime.trap("House not found or does not belong to you");
    };

    let payments = account.payments;

    if (paymentIndex >= payments.size()) {
      Runtime.trap("Payment not found/does not belong to you");
    };

    let allPaymentsArray = payments.toArray();

    let newPayment : Payment = {
      amount;
      date;
      note;
      houseId;
      paymentMethod;
    };

    let updatedPaymentsArray = Array.tabulate(
      allPaymentsArray.size(),
      func(i) {
        if (i == paymentIndex) { newPayment } else {
          allPaymentsArray[i];
        };
      },
    );

    let updatedPaymentsList = List.fromArray<Payment>(updatedPaymentsArray);

    let updatedAccount : Account = {
      account with
      payments = updatedPaymentsList;
    };
    updateAccount(caller, updatedAccount);
  };

  // Payment Deletion
  public shared ({ caller }) func deletePayment(paymentIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payments");
    };

    let account = getAccountHelper(caller);
    let payments = account.payments;

    if (paymentIndex >= payments.size()) {
      Runtime.trap("Payment not found/does not belong to you");
    };

    let allPaymentsArray = payments.toArray();
    let paymentToDelete = allPaymentsArray[paymentIndex];

    let houseExists = switch (account.houses.get(paymentToDelete.houseId)) {
      case (?_house) { true };
      case (null) { false };
    };

    if (not houseExists) {
      Runtime.trap("Unauthorized: Payment's associated house not found or does not belong to you");
    };

    let filteredArray = if (allPaymentsArray.size() == 0) {
      [] : [Payment];
    } else {
      Array.tabulate(
        allPaymentsArray.size() - 1,
        func(i) {
          if (i < paymentIndex) { allPaymentsArray[i] } else {
            allPaymentsArray[i + 1];
          };
        },
      );
    };

    let filteredPaymentsList = List.fromArray<Payment>(filteredArray);

    let updatedAccount : Account = {
      account with
      payments = filteredPaymentsList;
    };
    updateAccount(caller, updatedAccount);
  };

  // Interest-Adjusted Calculations
  public query ({ caller }) func getHouseProgress(houseId : Text) : async HouseProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view progress");
    };

    let account = getAccountHelper(caller);
    let house = account.houses.get(houseId);

    switch (house) {
      case (?house) {
        let payments = account.payments;

        let totalPaid = payments.foldLeft(
          0.0,
          func(acc, payment) {
            if (payment.houseId == houseId) { acc + payment.amount } else {
              acc;
            };
          },
        );

        let loanAmount = house.totalCost - house.downPayment;
        let interestAmount = loanAmount * (house.interestRate / 100.0);
        let totalCostWithInterest = loanAmount + interestAmount;
        let remainingBalance = totalCostWithInterest - totalPaid;
        let progressPercentage = if (totalCostWithInterest == 0.0) { 0.0 } else {
          (totalPaid / totalCostWithInterest) * 100.0;
        };

        {
          totalPaid;
          remainingBalance;
          progressPercentage;
          interestAmount;
          downPayment = house.downPayment;
          loanTermYears = house.loanTermYears;
          totalLoanAmount = totalCostWithInterest;
        };
      };
      case (null) {
        Runtime.trap("House not found");
      };
    };
  };

  public query ({ caller }) func getPaymentHistoryByHouse(houseId : Text) : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };

    let account = getAccountHelper(caller);
    let houseExists = switch (account.houses.get(houseId)) {
      case (?_house) { true };
      case (null) { false };
    };

    if (not houseExists) {
      Runtime.trap("Unauthorized: House not found or does not belong to you");
    };

    let payments = account.payments;
    let filteredPayments = payments.filter(
      func(payment) {
        payment.houseId == houseId;
      }
    );
    filteredPayments.toArray().sort();
  };

  public type OverviewData = {
    userProfile : UserProfile;
    housesWithProgress : [HouseWithProgress];
    dashboardSummary : DashboardSummary;
  };

  public query ({ caller }) func getBootstrapData() : async OverviewData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use this endpoint");
    };

    let account = getAccountHelper(caller);

    let housesWithProgress = account.houses.values().toArray().map(
      func(house) {
        let totalPaid = account.payments.foldLeft(
          0.0,
          func(acc, payment) {
            if (payment.houseId == house.id) { acc + payment.amount } else {
              acc;
            };
          },
        );

        let loanAmount = house.totalCost - house.downPayment;
        let interestAmount = loanAmount * (house.interestRate / 100.0);
        let totalAmountToPay = loanAmount + interestAmount;
        let remainingBalance = totalAmountToPay - totalPaid;
        let progressPercentage = if (totalAmountToPay == 0.0) { 0.0 } else {
          (totalPaid / totalAmountToPay) * 100.0;
        };

        {
          house;
          totalPaid;
          remainingBalance;
          progressPercentage;
          interestAmount;
          totalAmountToPay;
        };
      }
    );

    let totalCost = account.houses.values().toArray().foldLeft(
      0.0,
      func(acc, house) {
        let loanAmount = house.totalCost - house.downPayment;
        let interestAmount = loanAmount * (house.interestRate / 100.0);
        acc + loanAmount + interestAmount;
      },
    );

    let totalPaid = account.payments.foldLeft(
      0.0,
      func(acc, payment) { acc + payment.amount },
    );

    let remainingBalance = totalCost - totalPaid;
    let overallProgress = if (totalCost == 0.0) { 0.0 } else {
      (totalPaid / totalCost) * 100.0;
    };

    let totalInterest = account.houses.values().toArray().foldLeft(
      0.0,
      func(acc, house) {
        let loanAmount = house.totalCost - house.downPayment;
        acc + (loanAmount * (house.interestRate / 100.0));
      },
    );

    {
      userProfile = account.userProfile;
      housesWithProgress;
      dashboardSummary = {
        totalHouses = account.houses.size();
        totalCost;
        totalPaid;
        remainingBalance;
        totalInterest;
        overallProgress;
        totalPayments = account.payments.size();
      };
    };
  };

  func isBackendVersionNewer(frontendVersion : AppVersion) : Bool {
    if (currentVersion.build > frontendVersion.build) { return true };
    if (currentVersion.build < frontendVersion.build) { return false };

    if (currentVersion.patch > frontendVersion.patch) { return true };
    if (currentVersion.patch < frontendVersion.patch) { return false };

    if (currentVersion.minor > frontendVersion.minor) { return true };
    if (currentVersion.minor < frontendVersion.minor) { return false };
    if (currentVersion.major > frontendVersion.major) { return true };

    false;
  };

  public query func getCurrentAppVersion() : async AppVersion {
    currentVersion;
  };

  public query func isUpdateAvailable(frontendVersion : AppVersion) : async Bool {
    isBackendVersionNewer(frontendVersion);
  };

  public query func healthCheck() : async Text {
    // Return a simple message indicating the canister is running
    "Canister is running";
  };

  public query func getInitializationStatus() : async Text {
    // Return the current initialization status
    "Initialized";
  };

  public shared ({ caller }) func safeInitialize() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only administrators can perform initialization");
    };
    "Initialization complete";
  };
};
