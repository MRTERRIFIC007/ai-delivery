const optimizeRoute = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch("http://localhost:5005/optimize-route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
