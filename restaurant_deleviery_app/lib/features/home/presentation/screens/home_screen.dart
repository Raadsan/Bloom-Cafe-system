import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFFE8F5E9), // Very light green
                const Color(0xFFF1F8F1), // Minty white
                Colors.white,
              ],
            ),
          ),
          child: Stack(
            children: [
              // Decorative background elements
              Positioned(
                top: -100,
                right: -50,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                top: 200,
                left: -100,
                child: Container(
                  width: 400,
                  height: 400,
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.03),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              SingleChildScrollView(
                padding: const EdgeInsets.only(
                  bottom: 100,
                ), // Space for floating bar
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    _buildHeader(),
                    const SizedBox(height: 20),
                    _buildSearchBar(),
                    const SizedBox(height: 25),
                    _buildSectionHeader("Order's List", () {}),
                    const SizedBox(height: 15),
                    _buildOrderList(),
                    const SizedBox(height: 25),
                    _buildSectionHeader("Search By Categories", () {}),
                    const SizedBox(height: 15),
                    _buildCategoryList(),
                    const SizedBox(height: 25),
                    _buildSectionHeader(
                      "All Pizza's",
                      () {},
                      showGridToggle: true,
                    ),
                    const SizedBox(height: 5),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        "List of all available pizzas in the store.",
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 15),
                    _buildPizzaList(),
                  ],
                ),
              ),
              // Floating Selection Bar
              _buildFloatingSelectionBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 25,
              backgroundImage: const AssetImage('assets/images/maria_logo.png'),
              backgroundColor: Colors.white,
              onBackgroundImageError: (exception, stackTrace) {},
              child: const Icon(
                Icons.restaurant,
                color: Colors.green,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Maria's Kitchen",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3E2D),
                  ),
                ),
                Row(
                  children: [
                    Icon(
                      IconlyLight.location,
                      size: 14,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        "Madhavaram Milk colony...",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ),
                    Icon(
                      Icons.keyboard_arrow_down,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Stack(
              children: [
                Icon(IconlyLight.notification, color: Colors.grey[800]),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: const SizedBox(width: 4, height: 4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 55,
              padding: const EdgeInsets.symmetric(horizontal: 15),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(IconlyLight.search, color: Colors.grey[400]),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: "What are you looking for?",
                        hintStyle: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 14,
                        ),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            height: 55,
            width: 55,
            decoration: BoxDecoration(
              color: const Color(0xFFA5D6A7), // Light green filter bg
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(IconlyLight.filter, color: Color(0xFF2E7D32)),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    VoidCallback onSeeAll, {
    bool showGridToggle = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3E2D),
            ),
          ),
          Row(
            children: [
              TextButton(
                onPressed: onSeeAll,
                child: Row(
                  children: [
                    Text(
                      "See all",
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_circle_right,
                      size: 16,
                      color: Colors.green[800],
                    ),
                  ],
                ),
              ),
              if (showGridToggle) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Icon(
                    Icons.grid_view_rounded,
                    size: 18,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderList() {
    return SizedBox(
      height: 150,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          _buildOrderCard(
            "#2140",
            "Ready to Serve",
            "🍔 🍕",
            "2 Items",
            "₹349.00",
            "2 Mins Ago",
            "Table 12",
            const Color(0xFFFFF9C4), // Yellowish for ready
          ),
          const SizedBox(width: 15),
          _buildOrderCard(
            "#2139",
            "Delivered",
            "🍪 🍫",
            "2 Items",
            "₹150.00",
            "10 Mins Ago",
            "Takeaway",
            const Color(0xFFFFEBEE), // Pinkish for delivered
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(
    String id,
    String status,
    String icons,
    String itemsCount,
    String price,
    String time,
    String location,
    Color statusColor,
  ) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Order $id",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 10,
                    color: status == "Delivered"
                        ? Colors.red[300]
                        : Colors.orange[400],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(icons, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Text(
                itemsCount,
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
              const Spacer(),
              Text(
                price,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              Icon(IconlyLight.time_circle, size: 14, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text(
                time,
                style: TextStyle(color: Colors.grey[400], fontSize: 11),
              ),
              const Spacer(),
              Icon(
                Icons.table_restaurant_outlined,
                size: 14,
                color: Colors.grey[400],
              ),
              const SizedBox(width: 4),
              Text(
                location,
                style: TextStyle(color: Colors.grey[400], fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryList() {
    return SizedBox(
      height: 50,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          _buildCategoryCard("🍕 Pizza", true),
          const SizedBox(width: 12),
          _buildCategoryCard("🍔 Burger", false),
          const SizedBox(width: 12),
          _buildCategoryCard("🍪 Cookie", false),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(String label, bool isSelected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF4CAF50) : Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: Colors.green.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ]
            : [],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey[800],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildPizzaList() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _buildPizzaCard(
            "Chili BBQ Chicken Pizza",
            "Our special bbq sauce with chicken and cheese",
            "-20%",
            "assets/images/pizza_bbq.png",
            6.28,
            7.85,
          ),
          const SizedBox(height: 15),
          _buildPizzaCard(
            "Pepperoni Pizza",
            "Fresh Mozzarella, beef pepperoni and sauce",
            "-20%",
            "assets/images/pizza_pepperoni.png",
            5.08,
            6.35,
          ),
          const SizedBox(height: 15),
          _buildPizzaCard(
            "Mixed Pizza",
            "Chicken and meat mixed with black olives.",
            "-20%",
            "assets/images/pizza_cheese.png", // Reusing cheese image for demo
            5.48,
            6.85,
          ),
          const SizedBox(height: 15),
          _buildPizzaCard(
            "Shrimp Pizza",
            "Topped with light-garlic lemon sauce with cheese and Jaa sauce",
            "-20%",
            "assets/images/pizza_cheese.png", // Reusing image
            7.80,
            9.75,
          ),
        ],
      ),
    );
  }

  Widget _buildPizzaCard(
    String title,
    String desc,
    String discount,
    String image,
    double price,
    double oldPrice,
  ) {
    return Container(
      height: 110,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          // Image with Discount Badge
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(15),
                ),
                child: Image.asset(
                  image,
                  width: 110,
                  height: 110,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 110,
                    height: 110,
                    color: Colors.grey[200],
                    child: const Icon(Icons.star, color: Colors.grey),
                  ),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD54F), // Yellow discount
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    discount,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Details
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[500], fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
          // Price and Plus Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      "\$${price.toStringAsFixed(2)}",
                      style: const TextStyle(
                        color: Color(0xFFFBC02D), // Gold/Yellow price
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      "\$${oldPrice.toStringAsFixed(2)}",
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 10,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    // Add to cart logic
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFA5D6A7), // Light green plus button
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.green.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Color(0xFF2E7D32),
                      size: 24,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingSelectionBar() {
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: const Color(0xFF1B3022), // Dark green
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "01 Items selected",
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
                Text(
                  "Cheese Pizza, with tomato flavor.",
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Text(
                    "98",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(Icons.arrow_forward_ios, color: Colors.white, size: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
