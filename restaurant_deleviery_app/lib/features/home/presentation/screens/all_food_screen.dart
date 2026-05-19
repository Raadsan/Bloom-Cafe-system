import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/core/theme/colors.dart';
import '../controllers/home_controller.dart';
import '../widgets/food_card.dart';
import 'product_details_screen.dart';
import 'package:iconly/iconly.dart';
import '../widgets/checkout_overlay.dart';

class AllFoodScreen extends StatelessWidget {
  const AllFoodScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'All Food',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w400,
            fontSize: 22,
            fontFamily: "Poppins",
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(IconlyLight.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: AppColors.bgColor,
      body: Stack(
        children: [
          Consumer<HomeController>(
            builder: (context, controller, child) {
              final items = controller.filteredMenuItems;
              const defaultImage = "assets/images/pizza_cheese.png";

              if (items.isEmpty) {
                return const Center(
                  child: Text(
                    "No items available.",
                    style: TextStyle(color: Colors.grey),
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  final image =
                      (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                      ? item.imageUrl!
                      : defaultImage;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 15),
                    child: FoodCard(
                      id: item.id,
                      title: item.name,
                      desc: item.description ?? "Delicious ${item.name}",
                      image: image,
                      price: item.price,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ProductDetailsScreen(
                              id: item.id,
                              title: item.name,
                              image: image,
                              price: "\$${item.price.toStringAsFixed(2)}",
                              description:
                                  item.description ??
                                  "Enjoy our delicious ${item.name}.",
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              );
            },
          ),
          const CheckoutOverlay(),
        ],
      ),
    );
  }
}
