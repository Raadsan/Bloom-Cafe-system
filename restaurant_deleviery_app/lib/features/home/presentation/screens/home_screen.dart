import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import '../../../../core/theme/colors.dart';
import '../../../notifications/presentation/screens/notifications_screen.dart';
import '../widgets/pizza_card.dart';
import '../widgets/pizza_grid_item.dart';
import '../widgets/recommended_card.dart';
import 'product_details_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isGridView = false;

  void _navigateToDetails(String title, String image, String price, String desc) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailsScreen(
          title: title,
          image: image,
          price: price,
          description: desc,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      body: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppColors.bgColor,
                const Color(0xFFF1F8F1),
                Colors.white,
              ],
            ),
          ),
          child: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    _buildHeader(),
                    const SizedBox(height: 10),
                    _buildSearchBar(),
                    const SizedBox(height: 25),
                    _buildSectionHeader("Search By Categories", () {}),
                    const SizedBox(height: 5),
                    _buildCategoryList(),
                    const SizedBox(height: 25),
                    _buildRecommendedSection(),
                    const SizedBox(height: 25),
                    _buildSectionHeader(
                      "All Pizza's",
                      () {},
                      showGridToggle: true,
                      isGrid: _isGridView,
                      onGridToggle: () {
                        setState(() {
                          _isGridView = !_isGridView;
                        });
                      },
                    ),
                    const SizedBox(height: 5),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        "List of all available pizzas in the store.",
                        style: TextStyle(color: Colors.grey[600], fontSize: 12, fontFamily: "Poppins"),
                      ),
                    ),
                    const SizedBox(height: 15),
                    _buildPizzaList(),
                  ],
                ),
              ),
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
            child: const CircleAvatar(
              radius: 25,
              backgroundImage: AssetImage('assets/images/maria_logo.png'),
              backgroundColor: Colors.white,
              child: Icon(Icons.restaurant, color: Colors.green, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Welcome",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: "Poppins",
                    color: Color(0xFF2D3E2D),
                  ),
                ),
                Row(
                  children: [
                    Icon(IconlyLight.location, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        "Somalia, Mogadishu",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600], fontFamily: "Poppins"),
                      ),
                    ),
                    Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.grey[600]),
                  ],
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationsScreen()),
              );
            },
            child: Container(
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
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      child: const SizedBox(width: 4, height: 4),
                    ),
                  ),
                ],
              ),
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
                        hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14, fontFamily: "Poppins"),
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
              color: const Color(0xFFA5D6A7),
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
    bool isGrid = false,
    VoidCallback? onGridToggle,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontFamily: "Poppins",
              fontWeight: FontWeight.w500,
              color: Color(0xFF2D3E2D),
            ),
          ),
          Row(
            children: [
              TextButton(
                onPressed: onSeeAll,
                child: Row(
                  children: [
                    Text("See all", style: TextStyle(color: Colors.grey[600], fontSize: 13, fontFamily: "Poppins")),
                    const SizedBox(width: 4),
                    Icon(IconlyLight.arrow_right_2, size: 16, color: Colors.green[800]),
                  ],
                ),
              ),
              if (showGridToggle) ...[
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: onGridToggle,
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: isGrid ? AppColors.primaryColor : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isGrid ? AppColors.primaryColor : Colors.grey[300]!),
                    ),
                    child: Icon(
                      isGrid ? Icons.list_rounded : Icons.grid_view_rounded,
                      size: 18,
                      color: isGrid ? Colors.white : Colors.grey[400],
                    ),
                  ),
                ),
              ],
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
            ? [BoxShadow(color: Colors.green.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))]
            : [],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey[800],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontFamily: "Poppins",
        ),
      ),
    );
  }

  Widget _buildPizzaList() {
    if (_isGridView) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 15,
          mainAxisSpacing: 15,
          childAspectRatio: 0.75,
          children: [
            PizzaGridItem(
              title: "Chili BBQ Chicken",
              desc: "Our special bbq sauce",
              image: "assets/images/pizza_bbq.png",
              price: 6.28,
              onTap: () => _navigateToDetails("Chili BBQ Chicken", "assets/images/pizza_bbq.png", "\$6.28", "Our special bbq sauce with chicken and cheese. Freshly baked in wood fire oven."),
            ),
            PizzaGridItem(
              title: "Pepperoni Pizza",
              desc: "Fresh Mozzarella",
              image: "assets/images/pizza_pepperoni.png",
              price: 5.08,
              onTap: () => _navigateToDetails("Pepperoni Pizza", "assets/images/pizza_pepperoni.png", "\$5.08", "Fresh Mozzarella, beef pepperoni and sauce. A classic choice for pizza lovers."),
            ),
            PizzaGridItem(
              title: "Mixed Pizza",
              desc: "Chicken and meat mixed",
              image: "assets/images/pizza_cheese.png",
              price: 5.48,
              onTap: () => _navigateToDetails("Mixed Pizza", "assets/images/pizza_cheese.png", "\$5.48", "Chicken and meat mixed with black olives and extra mozzarella cheese."),
            ),
            PizzaGridItem(
              title: "Shrimp Pizza",
              desc: "Light-garlic lemon sauce",
              image: "assets/images/pizza_cheese.png",
              price: 7.80,
              onTap: () => _navigateToDetails("Shrimp Pizza", "assets/images/pizza_cheese.png", "\$7.80", "Topped with light-garlic lemon sauce with cheese and Jaa sauce."),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          PizzaCard(
            title: "Chili BBQ Chicken Pizza",
            desc: "Our special bbq sauce with chicken and cheese",
            discount: "-20%",
            image: "assets/images/pizza_bbq.png",
            price: 6.28,
            oldPrice: 7.85,
            onTap: () => _navigateToDetails("Chili BBQ Chicken Pizza", "assets/images/pizza_bbq.png", "\$6.28", "Our special bbq sauce with chicken and cheese. Freshly baked in wood fire oven."),
          ),
          const SizedBox(height: 15),
          PizzaCard(
            title: "Pepperoni Pizza",
            desc: "Fresh Mozzarella, beef pepperoni and sauce",
            discount: "-20%",
            image: "assets/images/pizza_pepperoni.png",
            price: 5.08,
            oldPrice: 6.35,
            onTap: () => _navigateToDetails("Pepperoni Pizza", "assets/images/pizza_pepperoni.png", "\$5.08", "Fresh Mozzarella, beef pepperoni and sauce. A classic choice for pizza lovers."),
          ),
          const SizedBox(height: 15),
          PizzaCard(
            title: "Mixed Pizza",
            desc: "Chicken and meat mixed with black olives.",
            discount: "-20%",
            image: "assets/images/pizza_cheese.png",
            price: 5.48,
            oldPrice: 6.85,
            onTap: () => _navigateToDetails("Mixed Pizza", "assets/images/pizza_cheese.png", "\$5.48", "Chicken and meat mixed with black olives and extra mozzarella cheese."),
          ),
          const SizedBox(height: 15),
          PizzaCard(
            title: "Shrimp Pizza",
            desc: "Topped with light-garlic lemon sauce with cheese and Jaa sauce",
            discount: "-20%",
            image: "assets/images/pizza_cheese.png",
            price: 7.80,
            oldPrice: 9.75,
            onTap: () => _navigateToDetails("Shrimp Pizza", "assets/images/pizza_cheese.png", "\$7.80", "Topped with light-garlic lemon sauce with cheese and Jaa sauce."),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Recommended Food", () {}),
        const SizedBox(height: 15),
        SizedBox(
          height: 220,
          child: Stack(
            children: [
              Positioned.fill(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [AppColors.primaryColor.withOpacity(0.12), AppColors.primaryColor.withOpacity(0.0)],
                    ),
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
              ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 35, vertical: 10),
                physics: const BouncingScrollPhysics(),
                children: [
                  RecommendedCard(
                    title: "Gourmet Cheese Pizza",
                    desc: "Extra mozzarella with fresh herbs",
                    price: "₹299",
                    image: "assets/images/pizza_cheese.png",
                    discount: "15% OFF",
                    onTap: () => _navigateToDetails("Gourmet Cheese Pizza", "assets/images/pizza_cheese.png", "₹299", "Extra mozzarella with fresh herbs and organic tomatoes."),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "BBQ Feast Pizza",
                    desc: "Smoky chicken & red onions",
                    price: "₹450",
                    image: "assets/images/pizza_bbq.png",
                    discount: "HOT",
                    onTap: () => _navigateToDetails("BBQ Feast Pizza", "assets/images/pizza_bbq.png", "₹450", "Smoky chicken & red onions with our signature BBQ sauce."),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "Spicy Pepperoni",
                    desc: "Beef pepperoni with jalapeños",
                    price: "₹399",
                    image: "assets/images/pizza_pepperoni.png",
                    discount: "POPULAR",
                    onTap: () => _navigateToDetails("Spicy Pepperoni", "assets/images/pizza_pepperoni.png", "₹399", "Beef pepperoni with spicy jalapeños for an extra kick."),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "Veggie Paradise",
                    desc: "All garden fresh vegetables",
                    price: "₹349",
                    image: "assets/images/pizza_cheese.png",
                    discount: "VEG",
                    onTap: () => _navigateToDetails("Veggie Paradise", "assets/images/pizza_cheese.png", "₹349", "All garden fresh vegetables with low-fat mozzarella."),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
